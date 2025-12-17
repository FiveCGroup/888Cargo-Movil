// backend/routes/index.js
import express from 'express';
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

const TRM_COP_USD = 4250;
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