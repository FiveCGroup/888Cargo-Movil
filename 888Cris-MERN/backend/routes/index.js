// backend/routes/index.js
import express from 'express';
import cargaRoutes from './carga.routes.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Controladores
import {
  registerUser,
  loginUser,
  requestReset,
  resetPass
} from '../controllers/auth.controller.js';

import { logout } from '../controllers/auth.controller.simple.js';

import {
  procesarExcel,
  generarQRs,
  getMisCargas
} from '../controllers/carga.controller.js';

import {
  validarEscaneo,
  generarPDFCarga
} from '../controllers/qr.controller.js';

import puppeteer from 'puppeteer';

import {
  misCargas,
  detalleCarga
} from '../controllers/cliente.controller.js';

import {
  crearUsuarioAdmin,
  getUsuarios
} from '../controllers/admin.controller.js';

import { authRequired } from '../middlewares/auth.middleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer para subir Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.xlsx', '.xls'].includes(ext)) {
      return cb(new Error('Solo archivos Excel'));
    }
    cb(null, true);
  }
});

// RUTAS PÚBLICAS
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/logout', logout);
router.post('/auth/request-reset', requestReset);
router.post('/auth/reset-password', resetPass);

// RUTAS PÚBLICAS (sin prefijo - compatibilidad frontend)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logout);

// RUTA DEBUG (para logs del frontend)
router.post('/debug/frontend-log', (req, res) => {
  console.log('[Frontend]:', req.body);
  res.json({ success: true });
});

// Webhook de WhatsApp (Verificación y recepción de estados/mensajes)
router.get('/webhook/whatsapp', (req, res) => {
  // Endpoint para verificación (hub.challenge)
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[WhatsApp Webhook] GET verification request', { mode, token, challenge });

  if (mode && token) {
    // Aceptar cualquier token en desarrollo; en producción comparar con env WHATSAPP_WEBHOOK_TOKEN
    if (challenge) {
      return res.status(200).send(challenge);
    }
  }
  res.sendStatus(403);
});

router.post('/webhook/whatsapp', express.json(), (req, res) => {
  try {
    console.log('[WhatsApp Webhook] Event received:', JSON.stringify(req.body));
    // Aquí puedes procesar estados de entrega (delivered, failed) y persistir en DB
    // Ejemplo: recorrer entry -> changes -> value -> statuses/messages
    const body = req.body;
    if (body.entry && Array.isArray(body.entry)) {
      body.entry.forEach(entry => {
        if (entry.changes && Array.isArray(entry.changes)) {
          entry.changes.forEach(change => {
            console.log('[WhatsApp Webhook] change:', JSON.stringify(change));
          });
        }
      });
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// RUTA PERFIL
router.get('/profile', authRequired, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// =====================================
// RUTAS DE COTIZACIONES
// =====================================

const TRM_COP_USD = 3720;
const FACTOR_VOLUMETRICO = {
  MARITIMO: 1000,
  AEREO: 167
};
const TARIFAS_USD = {
  MARITIMO_LCL: {
    China: { min: 38, max: 45, promedio: 41.5 },
    Miami: { min: 35, max: 42, promedio: 38.5 },
    Europa: { min: 55, max: 65, promedio: 60 }
  },
  AEREO_KG: {
    China: { min: 4.8, max: 5.5, promedio: 5.15 },
    Miami: { min: 2.8, max: 3.2, promedio: 3.0 },
    Europa: { min: 4.2, max: 4.8, promedio: 4.5 }
  }
};
const MINIMO_MARITIMO_M3 = 1;
const MINIMO_AEREO_KG = 10;

// Cotización marítima
router.post('/cotizaciones/maritimo', async (req, res) => {
  try {
    const { peso_kg, largo_cm, ancho_cm, alto_cm, destino = 'China' } = req.body;
    
    const volumen = (largo_cm * ancho_cm * alto_cm) / 1000000;
    const volumenCobrable = Math.max(volumen, MINIMO_MARITIMO_M3);
    const pesoVolumetrico = volumen * FACTOR_VOLUMETRICO.MARITIMO;
    
    const tarifaDestino = TARIFAS_USD.MARITIMO_LCL[destino] || TARIFAS_USD.MARITIMO_LCL.China;
    const tarifaUSD = tarifaDestino.promedio;
    
    const costoUSD = volumenCobrable * tarifaUSD;
    const costoCOP = Math.round(costoUSD * TRM_COP_USD);
    
    const detalleCalculo = {
      pesoReal: peso_kg,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      volumenReal: volumen.toFixed(3),
      volumenCobrable: volumenCobrable.toFixed(3),
      tarifaUSD,
      tipoCobro: 'USD/m³',
      factorUsado: FACTOR_VOLUMETRICO.MARITIMO,
      gana: 'volumen (m³)',
      explicacion: 'En marítimo LCL se cobra SIEMPRE por volumen'
    };

    res.json({
      success: true,
      data: {
        volumen_m3: volumen.toFixed(3),
        peso_kg,
        valor_usd: costoUSD.toFixed(2),
        valor_cop: costoCOP,
        detalleCalculo,
        destino,
        trm: TRM_COP_USD,
        tiempo_estimado: '25-35 días'
      }
    });
  } catch (error) {
    console.error('Error cotización marítima:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cotización aérea
router.post('/cotizaciones/aereo', async (req, res) => {
  try {
    const { peso_kg, largo_cm, ancho_cm, alto_cm, destino = 'China' } = req.body;
    
    const volumen = (largo_cm * ancho_cm * alto_cm) / 1000000;
    const pesoVolumetrico = volumen * FACTOR_VOLUMETRICO.AEREO;
    const pesoCobrable = Math.max(peso_kg, pesoVolumetrico, MINIMO_AEREO_KG);
    
    const tarifaDestino = TARIFAS_USD.AEREO_KG[destino] || TARIFAS_USD.AEREO_KG.China;
    const tarifaUSD = tarifaDestino.promedio;
    
    const costoUSD = pesoCobrable * tarifaUSD;
    const costoCOP = Math.round(costoUSD * TRM_COP_USD);
    
    const gana = peso_kg > pesoVolumetrico ? 'peso real' : 'peso volumétrico';
    
    const detalleCalculo = {
      pesoReal: peso_kg,
      pesoVolumetrico: pesoVolumetrico.toFixed(2),
      pesoCobrable: pesoCobrable.toFixed(2),
      volumenReal: volumen.toFixed(3),
      tarifaUSD,
      tipoCobro: 'USD/kg',
      factorUsado: FACTOR_VOLUMETRICO.AEREO,
      gana,
      explicacion: `Se cobra el mayor entre peso real (${peso_kg} kg) y volumétrico (${pesoVolumetrico.toFixed(2)} kg)`
    };

    res.json({
      success: true,
      data: {
        volumen_m3: volumen.toFixed(3),
        peso_kg,
        valor_usd: costoUSD.toFixed(2),
        valor_cop: costoCOP,
        detalleCalculo,
        destino,
        trm: TRM_COP_USD,
        tiempo_estimado: '3-7 días'
      }
    });
  } catch (error) {
    console.error('Error cotización aérea:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generar PDF de cotización (server-side, usa Puppeteer para consistencia en navegadores)
router.post('/cotizaciones/pdf', async (req, res) => {
  try {
    const { tipo = 'maritimo', payload = {}, resultado = {}, detalleCalculo = {}, user = {} } = req.body;
    const userName = (user && (user.name || user.username || user.email)) || 'Usuario';

    // Plantilla HTML compacta y con estilo (mantiene el look & feel)
    const esMaritimo = tipo === 'maritimo';
    const tipoTexto = esMaritimo ? 'Marítimo LCL' : 'Aéreo';

    const formatCOP = (v) => {
      try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(v)); } catch { return v || '-'; }
    };
    const formatUSD = (v) => {
      try { return Number(v) ? Number(v).toFixed(2) : '-'; } catch { return v || '-'; }
    };

    const formattedCOP = formatCOP(resultado.valor_cop);
    const formattedUSD = formatUSD(resultado.valor_usd);

    const html = `<!doctype html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Cotización - ${userName}</title>
      <style>
        body{font-family:"Helvetica",Arial,sans-serif;background:#fff;color:#1f2937;margin:0;padding:0}
        .page{max-width:800px;margin:18px auto;padding:18px}
        .card{border-radius:12px;overflow:hidden;border:1px solid #e6eef8}
        .header{background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:#fff;padding:20px 24px}
        .logo{font-weight:800;font-size:20px}
        .subtitle{opacity:0.95;font-size:13px;margin-top:6px}
        .content{padding:18px}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .info{background:#fbfdff;padding:12px;border-radius:8px;border:1px solid #eef4fb}
        .label{font-size:12px;color:#64748b;font-weight:700}
        .value{font-size:16px;color:#0f1724;font-weight:800;margin-top:6px}
        .total{background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:#fff;padding:18px;text-align:center;border-radius:8px;margin-top:12px}
        .total-amount{font-size:36px;font-weight:900}
        .footer{padding:12px 18px;background:#f8fafc;border-top:1px solid #e9eef6;color:#64748b;font-size:12px}
        @media print{ .page{margin:6mm auto} }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="card">
          <div class="header">
            <div class="logo">888 CARGO</div>
            <div class="subtitle">Cotización para: ${userName} — ${tipoTexto}</div>
          </div>
          <div class="content">
            <div style="margin-bottom:10px;font-size:14px;color:#334155;font-weight:700">Información esencial</div>
            <div class="grid">
              <div class="info"><div class="label">Largo</div><div class="value">${payload.largo_cm || '-' } cm</div></div>
              <div class="info"><div class="label">Ancho</div><div class="value">${payload.ancho_cm || '-' } cm</div></div>
              <div class="info"><div class="label">Alto</div><div class="value">${payload.alto_cm || '-' } cm</div></div>
              <div class="info"><div class="label">Peso</div><div class="value">${payload.peso_kg || '-' } kg</div></div>
            </div>

            <div style="margin-top:14px;margin-bottom:6px;font-size:14px;color:#334155;font-weight:700">Resumen</div>
            <div class="grid">
              <div class="info"><div class="label">Volumen</div><div class="value">${resultado.volumen_m3 || '-' } m³</div></div>
              <div class="info"><div class="label">Tiempo estimado</div><div class="value">${resultado.tiempo_estimado || '-' }</div></div>
            </div>

            <div class="total">
              <div class="label">COSTO ESTIMADO</div>
              <div class="total-amount">${formattedCOP}</div>
              <div style="opacity:0.9;margin-top:6px;font-size:13px">USD ${formattedUSD} · TRM ${resultado.trm || '-'}</div>
            </div>
          </div>
          <div class="footer">
            888 CARGO · contacto@888cargo.com · WhatsApp: +57 321 706 1517
          </div>
          <div style="padding:16px 18px;">
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:15px;margin-top:12px;font-size:12px;color:#991b1b;text-align:left;">
              <strong>IMPORTANTE:</strong> Esta cotización es un estimado basado en la información proporcionada y está sujeta a verificación. Los precios pueden variar según temporada, peso exacto verificado, servicios adicionales requeridos y condiciones del mercado. Para cotización definitiva, contacte a nuestro equipo comercial.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm' } });
    await browser.close();

    const safeName = `Cotizacion_${userName.replace(/[^a-zA-Z0-9-_ ]/g,'').replace(/\s+/g,'_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF server-side:', error);
    return res.status(500).json({ success: false, message: 'Error generando PDF' });
  }
});

// Obtener historial de cotizaciones
router.get('/cotizaciones', authRequired, async (req, res) => {
  try {
    res.json({
      success: true,
      cotizaciones: []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// RUTAS CLIENTE
router.get('/cliente/mis-cargas', authRequired, misCargas);
router.get('/cliente/carga/:codigo', authRequired, detalleCarga);

// RUTAS CARGA
router.post('/carga/excel', authRequired, upload.single('file'), procesarExcel);
router.post('/carga/:cargaId/generar-qr', authRequired, generarQRs);
router.get('/carga/mis-cargas', authRequired, getMisCargas);

// RUTAS QR
router.post('/qr/validate', authRequired, validarEscaneo);
router.get('/qr/pdf/:cargaId', authRequired, generarPDFCarga);

// RUTAS ADMIN
router.post('/admin/crear-usuario', authRequired, crearUsuarioAdmin);
router.get('/admin/usuarios', authRequired, getUsuarios);

// RUTA DE SALUD
router.get('/health', (req, res) => {
  res.json({ success: true, message: '888Cargo Backend 100% funcional' });
});

export default router;