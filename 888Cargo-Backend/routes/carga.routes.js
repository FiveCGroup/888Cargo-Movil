import express from 'express';
import multer from 'multer';
import { 
    procesarExcel, 
    guardarPackingListConQR, 
    buscarPackingList,
    obtenerPackingList,
    obtenerCargaMeta
} from '../controllers/carga.controller.js';
import { authenticateToken } from '../utils/auth.middleware.js';

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de que esta carpeta existe
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '_'); // Reemplazar espacios
        cb(null, `${timestamp}_${originalName}`);
    }
});

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

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// POST /api/cargas/procesar-excel - Procesar archivo Excel
router.post('/procesar-excel', upload.single('excelFile'), async (req, res) => {
    console.log('🚀 [Carga Routes] POST /procesar-excel iniciado');
    console.log('📄 [Carga Routes] Archivo:', req.file ? req.file.filename : 'No hay archivo');
    console.log('👤 [Carga Routes] Usuario:', req.user ? req.user.id : 'No user');
    
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

// POST /api/cargas/guardar-packing-list - Guardar packing list con QR
router.post('/guardar-packing-list', async (req, res) => {
    console.log('🚀 [Carga Routes] POST /guardar-packing-list iniciado');
    console.log('📦 [Carga Routes] Datos recibidos:', {
        hasData: !!req.body.data,
        hasMetadata: !!req.body.metadata,
        userId: req.user ? req.user.id : 'No user'
    });
    
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

// GET /api/cargas/buscar - Buscar packing lists
router.get('/buscar', async (req, res) => {
    console.log('🚀 [Carga Routes] GET /buscar iniciado');
    console.log('🔍 [Carga Routes] Query params:', req.query);
    console.log('👤 [Carga Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await buscarPackingList(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error en buscar:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/cargas/:id - Obtener packing list específico
router.get('/:id', async (req, res) => {
    console.log('🚀 [Carga Routes] GET /:id iniciado');
    console.log('🆔 [Carga Routes] ID solicitado:', req.params.id);
    console.log('👤 [Carga Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await obtenerPackingList(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error en obtener packing list:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/cargas/:id/metadata - Obtener metadata de carga
router.get('/:id/metadata', async (req, res) => {
    console.log('🚀 [Carga Routes] GET /:id/metadata iniciado');
    console.log('🆔 [Carga Routes] ID carga:', req.params.id);
    console.log('👤 [Carga Routes] Usuario:', req.user ? req.user.id : 'No user');
    
    try {
        await obtenerCargaMeta(req, res);
    } catch (error) {
        console.error('❌ [Carga Routes] Error en obtener metadata:', error);
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
