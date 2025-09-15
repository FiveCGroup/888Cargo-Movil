import express from 'express';
import { 
    obtenerQRsPorCarga,
    obtenerQRPorCaja,
    servirImagenQR,
    servirImagenQRPorCodigo,
    obtenerEstadisticasQR,
    regenerarQRCaja,
    validarQREscaneado
} from '../controllers/qr.controller.new.js';
import { authenticateToken } from '../utils/auth.middleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas excepto imagen QR
router.use((req, res, next) => {
    // Las rutas de imagen QR no requieren autenticación para facilitar el acceso
    if (req.path.startsWith('/imagen/') || req.path.startsWith('/img/')) {
        return next();
    }
    authenticateToken(req, res, next);
});

// GET /api/qr/carga/:id_carga - Obtener QRs de una carga
router.get('/carga/:id_carga', async (req, res) => {
    console.log('🚀 [QR Routes] GET /carga/:id_carga iniciado');
    console.log('🆔 [QR Routes] ID Carga:', req.params.id_carga);
    console.log('👤 [QR Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await obtenerQRsPorCarga(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en obtener QRs por carga:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/qr/caja/:id_caja - Obtener QR de una caja específica
router.get('/caja/:id_caja', async (req, res) => {
    console.log('🚀 [QR Routes] GET /caja/:id_caja iniciado');
    console.log('📦 [QR Routes] ID Caja:', req.params.id_caja);
    console.log('👤 [QR Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await obtenerQRPorCaja(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en obtener QR por caja:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/qr/img/:filename - Servir imagen QR (sin autenticación)
router.get('/img/:filename', async (req, res) => {
    console.log('🚀 [QR Routes] GET /img/:filename iniciado');
    console.log('🏷️ [QR Routes] Filename:', req.params.filename);
    
    try {
        await servirImagenQR(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en servir imagen QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al servir imagen QR',
            error: error.message
        });
    }
});

// GET /api/qr/imagen/:codigoQR - Servir imagen QR por código (sin autenticación)
router.get('/imagen/:codigoQR', async (req, res) => {
    console.log('🚀 [QR Routes] GET /imagen/:codigoQR iniciado');
    console.log('🏷️ [QR Routes] Código QR:', req.params.codigoQR);
    
    try {
        await servirImagenQRPorCodigo(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en servir imagen QR por código:', error);
        res.status(500).json({
            success: false,
            message: 'Error al servir imagen QR',
            error: error.message
        });
    }
});

// GET /api/qr/estadisticas/:id_carga - Obtener estadísticas de QRs
router.get('/estadisticas/:id_carga', async (req, res) => {
    console.log('🚀 [QR Routes] GET /estadisticas/:id_carga iniciado');
    console.log('🆔 [QR Routes] ID Carga:', req.params.id_carga);
    console.log('� [QR Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await obtenerEstadisticasQR(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en estadísticas QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST /api/qr/regenerar/:id_caja - Regenerar QR para una caja
router.post('/regenerar/:id_caja', async (req, res) => {
    console.log('🚀 [QR Routes] POST /regenerar/:id_caja iniciado');
    console.log('📦 [QR Routes] ID Caja:', req.params.id_caja);
    console.log('👤 [QR Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await regenerarQRCaja(req, res);
    } catch (error) {
        console.error('❌ [QR Routes] Error en regenerar QR:', error);
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
