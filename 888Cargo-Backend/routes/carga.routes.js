import express from 'express';
import multer from 'multer';
import { 
    procesarExcel, 
    guardarPackingListConQR, 
    buscarPackingList,
    generarCodigoCarga,
    obtenerCargaPorId,
    obtenerQRsDeCarga
} from '../controllers/carga.controller.js';
import { authenticateToken } from '../utils/auth.middleware.js';

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage(); // Usar memoria en lugar de disco para mayor compatibilidad

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log(`📁 [Carga Routes] Archivo recibido: ${file.originalname}`);
        console.log(`📁 [Carga Routes] Tipo MIME: ${file.mimetype}`);
        
        // Aceptar archivos Excel
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel' ||
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// POST /api/cargas/procesar-excel - Procesar archivo Excel (sin autenticación para móvil)
router.post('/procesar-excel', upload.single('excelFile'), async (req, res) => {
    console.log('🚀 [Carga Routes] POST /procesar-excel iniciado');
    console.log('📄 [Carga Routes] Archivo:', req.file ? req.file.filename : 'No hay archivo');
    console.log('� [Carga Routes] Petición desde móvil (sin autenticación)');
    
    try {
        await procesarExcel(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error en procesar-excel:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST /api/cargas/guardar-packing-list - Guardar packing list con QR (sin autenticación para móvil)
router.post('/guardar-packing-list', async (req, res) => {
    console.log('🚀 [Carga Routes] POST /guardar-packing-list iniciado');
    console.log('📦 [Carga Routes] Datos recibidos:', {
        hasData: !!req.body.data,
        hasMetadata: !!req.body.metadata
    });
    console.log('📱 [Carga Routes] Petición desde móvil (sin autenticación)');
    
    try {
        await guardarPackingListConQR(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error en guardar-packing-list:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/cargas/buscar/:codigo - Buscar packing list por código (sin autenticación para móvil)
router.get('/buscar/:codigo', async (req, res) => {
    console.log('🚀 [Carga Routes] GET /buscar/:codigo iniciado');
    console.log('🔍 [Carga Routes] Código:', req.params.codigo);
    console.log('� [Carga Routes] Petición desde móvil (sin autenticación)');
    
    try {
        await buscarPackingList(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error en buscar por código:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/cargas/generar-codigo - Generar código único para carga (sin autenticación para móvil)
router.get('/generar-codigo', async (req, res) => {
    console.log('🚀 [Carga Routes] GET /generar-codigo iniciado');
    console.log('� [Carga Routes] Petición desde móvil (sin autenticación)');
    
    try {
        const codigoCarga = generarCodigoCarga();
        res.json({
            success: true,
            codigo_carga: codigoCarga,
            message: 'Código generado exitosamente'
        });
    } catch (error) {
        console.error('❌ [Carga Routes] Error al generar código:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/cargas/:idCarga - Obtener información de una carga (sin autenticación para móvil)
router.get('/:idCarga', async (req, res) => {
    console.log('🚀 [Carga Routes] GET /:idCarga iniciado');
    console.log('📋 [Carga Routes] ID de carga:', req.params.idCarga);
    console.log('📱 [Carga Routes] Petición desde móvil (sin autenticación)');
    
    try {
        await obtenerCargaPorId(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error al obtener carga:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/cargas/:idCarga/qrs - Obtener QRs de una carga (sin autenticación para móvil)
router.get('/:idCarga/qrs', async (req, res) => {
    console.log('🚀 [Carga Routes] GET /:idCarga/qrs iniciado');
    console.log('🏷️ [Carga Routes] ID de carga:', req.params.idCarga);
    console.log('📱 [Carga Routes] Petición desde móvil (sin autenticación)');
    
    try {
        await obtenerQRsDeCarga(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error al obtener QRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Middleware de manejo de errores para multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('❌ [Carga Routes] Error de Multer:', error);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. Máximo 10MB.'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: 'Error al procesar el archivo',
            error: error.message
        });
    }
    
    if (error.message === 'Solo se permiten archivos Excel (.xlsx, .xls)') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    console.error('❌ [Carga Routes] Error no manejado:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
    });
});

export default router;
