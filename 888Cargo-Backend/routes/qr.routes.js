import express from 'express';
import { 
    obtenerQRDataDeCarga,
    obtenerImagenQR,
    generarQRDataParaCarga,
    validarQREscaneado
} from '../controllers/qr.controller.js';
import { authenticateToken } from '../utils/auth.middleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas excepto imagen QR
router.use((req, res, next) => {
    // La ruta de imagen QR no requiere autenticación para facilitar el acceso
    if (req.path.startsWith('/imagen/')) {
        return next();
    }
    authenticateToken(req, res, next);
});

// GET /api/qr/carga/:idCarga - Obtener datos QR de una carga
router.get('/carga/:idCarga', async (req, res) => {
    console.log('🚀 [QR Routes] GET /carga/:idCarga iniciado');
    console.log('🆔 [QR Routes] ID Carga:', req.params.idCarga);
    console.log('👤 [QR Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await obtenerQRDataDeCarga(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en obtener QR data:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/qr/imagen/:qrCode - Obtener imagen QR (sin autenticación)
router.get('/imagen/:qrCode', async (req, res) => {
    console.log('🚀 [QR Routes] GET /imagen/:qrCode iniciado');
    console.log('🏷️ [QR Routes] QR Code:', req.params.qrCode ? 'Presente' : 'Ausente');
    console.log('📏 [QR Routes] Tamaño:', req.query.size || 'default');
    
    try {
        await obtenerImagenQR(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en obtener imagen QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar imagen QR',
            error: error.message
        });
    }
});

// POST /api/qr/generar/:idCarga - Generar QRs para una carga
router.post('/generar/:idCarga', async (req, res) => {
    console.log('🚀 [QR Routes] POST /generar/:idCarga iniciado');
    console.log('🆔 [QR Routes] ID Carga:', req.params.idCarga);
    console.log('👤 [QR Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await generarQRDataParaCarga(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en generar QRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST /api/qr/validar - Validar QR escaneado
router.post('/validar', async (req, res) => {
    console.log('🚀 [QR Routes] POST /validar iniciado');
    console.log('🔍 [QR Routes] Datos QR:', req.body.qrData ? 'Presente' : 'Ausente');
    console.log('👤 [QR Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await validarQREscaneado(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en validar QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

export default router;
