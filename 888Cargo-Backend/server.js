import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import cargaRoutes from './routes/carga.routes.js';
import qrRoutes from './routes/qr.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3102;

console.log('🚀 [888Cargo Backend] Iniciando servidor modular con ES modules...');

// ================== MIDDLEWARE ==================

// CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:19006', 'exp://192.168.1.100:19000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Static files para QRs
app.use('/qr-images', express.static(path.join(__dirname, 'qr-images')));

// ================== RUTAS ==================

// Health check
app.get('/api/health', (req, res) => {
    console.log('🏥 [888Cargo Backend] Health check solicitado');
    res.json({ 
        status: 'ok', 
        port: PORT,
        timestamp: new Date().toISOString(),
        service: '888Cargo Mobile Backend',
        version: '2.0.0'
    });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de cargas
app.use('/api/cargas', cargaRoutes);

// Rutas de QR
app.use('/api/qr', qrRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: '888Cargo Mobile Backend API',
        version: '2.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            cargas: '/api/cargas',
            qr: '/api/qr'
        },
        documentation: {
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                profile: 'GET /api/auth/profile',
                resetPassword: 'POST /api/auth/reset-password'
            },
            cargas: {
                procesarExcel: 'POST /api/cargas/procesar-excel',
                guardarPackingList: 'POST /api/cargas/guardar-packing-list',
                buscarPorCodigo: 'GET /api/cargas/buscar/:codigo',
                generarCodigo: 'GET /api/cargas/generar-codigo'
            },
            qr: {
                obtenerQR: 'GET /api/qr/:id',
                obtenerPorCaja: 'GET /api/qr/caja/:id_caja'
            }
        }
    });
});

// ================== MANEJO DE ERRORES ==================

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    console.log(`❌ [888Cargo Backend] Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    console.error('❌ [888Cargo Backend] Error no manejado:', error);
    
    // Error de validación de JSON
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en el cuerpo de la petición',
            error: 'Syntax Error'
        });
    }

    // Error de archivo demasiado grande
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'Archivo demasiado grande',
            error: 'File too large'
        });
    }

    // Error genérico
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// ================== INICIALIZACIÓN ==================

async function startServer() {
    try {
        // Inicializar base de datos
        console.log('🗄️ [888Cargo Backend] Inicializando base de datos...');
        await initDatabase();
        console.log('✅ [888Cargo Backend] Base de datos inicializada correctamente');

        // Crear directorio para QRs si no existe
        const qrDir = path.join(__dirname, 'qr-images');
        try {
            await import('fs').then(fs => fs.promises.mkdir(qrDir, { recursive: true }));
            console.log('📁 [888Cargo Backend] Directorio QR-images verificado');
        } catch (error) {
            console.warn('⚠️ [888Cargo Backend] Error al crear directorio QR:', error.message);
        }

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🎉 [888Cargo Backend] ========================================');
            console.log(`🎉 [888Cargo Backend] Servidor iniciado en puerto ${PORT}`);
            console.log('🎉 [888Cargo Backend] ========================================');
            console.log(`🌐 [888Cargo Backend] API disponible en: http://localhost:${PORT}`);
            console.log(`🏥 [888Cargo Backend] Health check: http://localhost:${PORT}/api/health`);
            console.log(`📚 [888Cargo Backend] Documentación: http://localhost:${PORT}/`);
            console.log('🎉 [888Cargo Backend] ========================================');
        });

    } catch (error) {
        console.error('❌ [888Cargo Backend] Error al iniciar servidor:', error);
        process.exit(1);
    }
}

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('🛑 [888Cargo Backend] Cerrando servidor por SIGINT...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 [888Cargo Backend] Terminando servidor por SIGTERM...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('💥 [888Cargo Backend] Excepción no capturada:', err);
    // No salir inmediatamente para debug
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 [888Cargo Backend] Promesa rechazada no manejada:', reason);
    // No salir inmediatamente para debug
});

// Iniciar el servidor
startServer();

export default app;