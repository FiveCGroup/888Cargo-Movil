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
  getMisCargas,
  guardarConQR,
  obtenerPackingList,
  obtenerCargaPorId,
  buscarPorCodigo,
  generarCodigoCarga,
  transformarExcel
} from '../controllers/carga.controller.js';

import {
  validarEscaneo,
  generarPDFCarga,
  obtenerQRsParaCargaDebug,
  obtenerImagenQR
} from '../controllers/qr.controller.js';

import puppeteer from 'puppeteer';

import {
  misCargas,
  detalleCarga
} from '../controllers/cliente.controller.js';

import {
  listarCargasCliente,
  obtenerEstadosCargaDetallados,
  obtenerOpcionesFiltrosDisponibles,
  obtenerCargaPorId as obtenerCargaControlCargas
} from '../controllers/controlCargas.controller.js';

import {
  crearUsuarioAdmin,
  getUsuarios
} from '../controllers/admin.controller.js';

import {
  cotizarMaritimo,
  cotizarAereo
} from '../controllers/cotizacion.controller.js';

import { authRequired } from '../middlewares/auth.middleware.js';
import databaseRepository from '../repositories/index.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer para subir Excel
const upload = multer({
  storage: multer.memoryStorage(),
  // Permitir hasta 50MB para archivos Excel grandes (alineado con cliente)
  limits: { fileSize: 50 * 1024 * 1024 },
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

// Obtener packing list (artículos + cajas)
router.get('/carga/packing-list/:id', authRequired, obtenerPackingList);

// Alias público para obtener metadata de carga (compatibilidad móvil)
router.get('/carga/carga/:id', obtenerCargaPorId);

// RUTA PERFIL
router.get('/profile', authRequired, async (req, res) => {
  try {
    // Obtener información del cliente asociado al usuario
    let clienteInfo = null;
    if (req.user?.email) {
      try {
        clienteInfo = await databaseRepository.clientes.findOne({
          correo_cliente: req.user.email
        });
      } catch (err) {
        console.warn('No se pudo obtener información del cliente:', err.message);
      }
    }

    // Combinar información del usuario con información del cliente
    const userProfile = {
      ...req.user,
      shippingMark: clienteInfo?.cliente_shippingMark || null,
      ciudad: clienteInfo?.ciudad_cliente || null,
      direccion_entrega: clienteInfo?.direccion_entrega || null
    };

    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Error al obtener perfil completo:', error);
    // Si hay error, devolver al menos la información básica del usuario
    res.json({
      success: true,
      user: req.user
    });
  }
});

// =====================================
// RUTAS DE COTIZACIONES
// =====================================

// Cotización marítima - Usa el servicio con dos fórmulas (volumen y volumen+peso) y selecciona el mayor
router.post('/cotizaciones/maritimo', cotizarMaritimo);

// Cotización aérea
router.post('/cotizaciones/aereo', cotizarAereo);

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
        body{font-family:"Helvetica",Arial,sans-serif;background:#fff;color:#111827;margin:0;padding:0}
        .page{max-width:800px;margin:18px auto;padding:18px}
        .card{border-radius:12px;overflow:hidden;border:1px solid #e6eef8}
        .header{background:#0f3d6e;color:#fff;padding:20px 24px}
        .logo{font-weight:800;font-size:20px}
        .subtitle{opacity:0.95;font-size:13px;margin-top:6px}
        .content{padding:18px}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .info{background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #eef2f7}
        .label{font-size:12px;color:#6b7280;font-weight:700}
        .value{font-size:16px;color:#0f1724;font-weight:800;margin-top:6px}
        .total{background:#eef6ff;color:#0f172a;padding:16px;border-radius:8px;margin-top:12px;border:1px solid #dbeafe}
        .total-amount{font-size:28px;font-weight:900}
        .footer{padding:12px 18px;background:#f8fafc;border-top:1px solid #e9eef6;color:#64748b;font-size:12px}
        @media print{ .page{margin:6mm auto} }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="card">
          <div class="header">
            <div class="logo">888 CARGO</div>
            <div class="subtitle">Cotización informativa · ${tipoTexto}</div>
          </div>
          <div class="content">
            <div style="font-size:14px;color:#334155;font-weight:700;margin-bottom:8px">Resumen</div>
            <div class="grid">
              <div class="info"><div class="label">Cliente</div><div class="value">${userName}</div></div>
              <div class="info"><div class="label">Destino</div><div class="value">${resultado.destino || '-'}</div></div>
              <div class="info"><div class="label">Tiempo estimado</div><div class="value">${resultado.tiempo_estimado || '-'}</div></div>
              <div class="info"><div class="label">TRM</div><div class="value">${resultado.trm || '-'}</div></div>
            </div>

            <div style="margin-top:14px;margin-bottom:6px;font-size:14px;color:#334155;font-weight:700">Medidas</div>
            <div class="grid">
              <div class="info"><div class="label">Largo</div><div class="value">${payload.largo_cm || '-' } cm</div></div>
              <div class="info"><div class="label">Ancho</div><div class="value">${payload.ancho_cm || '-' } cm</div></div>
              <div class="info"><div class="label">Alto</div><div class="value">${payload.alto_cm || '-' } cm</div></div>
              <div class="info"><div class="label">Peso</div><div class="value">${payload.peso_kg || '-' } kg</div></div>
            </div>

            <div style="margin-top:14px;margin-bottom:6px;font-size:14px;color:#334155;font-weight:700">Totales</div>
            <div class="total">
              <div class="label">Valor estimado</div>
              <div class="total-amount">${formattedCOP}</div>
              <div style="opacity:0.9;margin-top:4px;font-size:13px">USD ${formattedUSD}</div>
            </div>
          </div>
          <div class="footer">
            888 CARGO · contacto@888cargo.com · WhatsApp: +57 321 706 1517
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

// RUTAS CONTROL DE CARGAS (Módulo Control de Cargas)
// Obtener todas las cargas del cliente autenticado con filtros opcionales
// Query params: ?estado=En%20bodega&ubicacion=China&contenedor=CONT123
router.get('/control-cargas/cargas', authRequired, listarCargasCliente);

// Obtener información de una carga específica
router.get('/control-cargas/carga/:id', authRequired, obtenerCargaControlCargas);

// Obtener estados detallados de una carga (historial completo)
router.get('/control-cargas/carga/:id/estados', authRequired, obtenerEstadosCargaDetallados);

// Obtener opciones disponibles para los filtros (estados, ubicaciones, contenedores)
router.get('/control-cargas/filtros/opciones', authRequired, obtenerOpcionesFiltrosDisponibles);

// RUTAS CARGA
// Endpoints existentes
router.post('/carga/excel', authRequired, upload.single('file'), procesarExcel);
router.post('/carga/:cargaId/generar-qr', authRequired, generarQRs);
router.get('/carga/mis-cargas', authRequired, getMisCargas);

// Búsqueda por código (web y móvil)
router.get('/carga/buscar/:codigo', authRequired, buscarPorCodigo);

// Generar código único para packing list (móvil)
router.get('/carga/generar-codigo', authRequired, generarCodigoCarga);

// Aliases de compatibilidad con frontend (mantener rutas antiguas usadas por cliente)
router.post('/carga/procesar-excel', authRequired, upload.single('file'), procesarExcel);
router.post('/carga/guardar-con-qr', authRequired, guardarConQR);
router.post('/carga/transformar-excel', authRequired, upload.single('file'), transformarExcel);

// RUTAS QR
router.post('/qr/validate', authRequired, validarEscaneo);
router.get('/qr/pdf/:cargaId', authRequired, generarPDFCarga);
// Alias para compatibilidad con cliente móvil
router.get('/qr/pdf-carga/:cargaId', generarPDFCarga);

// Endpoint para obtener QRs de una carga (público para compatibilidad)
router.get('/qr/carga/:id/data', obtenerQRsParaCargaDebug);
// Endpoint debug público que usa el cliente móvil para obtener QRs de una carga
router.get('/qr/debug/carga/:id/data', obtenerQRsParaCargaDebug);

// Obtener imagen PNG del QR (genera on-the-fly). Público para consumo desde app.
router.get('/qr/image/:id', obtenerImagenQR);

// RUTAS ADMIN
router.post('/admin/crear-usuario', authRequired, crearUsuarioAdmin);
router.get('/admin/usuarios', authRequired, getUsuarios);

// RUTA DE SALUD
router.get('/health', (req, res) => {
  res.json({ success: true, message: '888Cargo Backend 100% funcional' });
});

export default router;