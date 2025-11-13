import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import swaggerUi from 'swagger-ui-express';

// Importar configuración básica
import { UPLOAD_CONFIG } from "./config.js";
import { swaggerSpec, swaggerUiOptions } from "./config/swagger.config.js";

// Importar rutas
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import recuperacionRoutes from "./routes/recuperacion.routes.js";
import cargaRoutes from "./routes/carga.routes.js";
import qrRoutes from "./routes/qr.routes.js";
import debugRoutes from "./routes/debug.routes.js";

// Importar tareas de limpieza
import { CleanupTasks } from "./tasks/cleanup.tasks.js";

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear aplicación Express
const app = express();

// Configurar middleware básico
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos
        const allowedOrigins = [
            "http://localhost:5173", 
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://10.0.2.2:4000",           // Android Emulator acceso
            "http://localhost:8081",          // Expo Dev Tools
            "http://127.0.0.1:8081",          // Expo Dev Tools alternativo
        ];
        
        // En desarrollo, permitir cualquier IP local (192.168.x.x, 10.x.x.x)
        const isDevelopment = process.env.NODE_ENV !== 'production';
        if (isDevelopment) {
            const localIpPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;
            const expPattern = /^exp:\/\//; // Protocolo Expo
            
            if (localIpPattern.test(origin) || expPattern.test(origin)) {
                return callback(null, true);
            }
        }
        
        // Verificar si el origen está en la lista permitida
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('⚠️ [CORS] Origen no permitido:', origin);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true  
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' })); // Aumentar límite para JSON
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Aumentar límite para datos de formulario
app.use(cookieParser());

// Servir archivos estáticos (imágenes)
const uploadsPath = path.resolve(process.cwd(), UPLOAD_CONFIG.uploadPath);
app.use('/uploads', express.static(uploadsPath));

// Servir documentación técnica generada con TypeDoc
// La carpeta code-docs está en la raíz del workspace (2 niveles arriba)
const codeDocsPath = path.resolve(__dirname, '../../code-docs');
console.log('📚 [Backend] Ruta de documentación:', codeDocsPath);
app.use('/code-docs', express.static(codeDocsPath));

// Endpoint de depuración para verificar la ruta de documentación
app.get('/api/debug/docs-path', (req, res) => {
    const fs = require('fs');
    res.json({
        path: codeDocsPath,
        exists: fs.existsSync(codeDocsPath),
        files: fs.existsSync(codeDocsPath) ? fs.readdirSync(codeDocsPath) : []
    });
});

// Documentación de API con Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Endpoint para obtener especificación OpenAPI en JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Endpoint de verificación de estado
app.get('/api/health', (req, res) => {
    const healthInfo = {
        status: 'ok',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: 'SQLite',
        features: {
            authentication: true,
            tasks: true,
            qr: true,
            fileUpload: true,
            passwordRecovery: true
        }
    };
    
    res.json(healthInfo);
});

// Endpoint de prueba POST
app.post('/api/test-post', (req, res) => {
    try {
        res.json({
            status: 'success',
            message: 'POST funcionando correctamente',
            received: req.body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Backend] Test POST endpoint error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint para verificar las tablas de la base de datos
app.get('/api/debug/tables', async (req, res) => {
    try {
        const { query } = await import('./db.js');
        const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
        res.json({
            status: 'success',
            tables: tables.map(t => t.name),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error verificando tablas:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint para estadísticas del sistema usando repositories
app.get('/api/stats', async (req, res) => {
    try {
        const { default: databaseRepository } = await import('./repositories/index.js');
        const stats = await databaseRepository.getSystemStats();
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error obteniendo estadísticas del sistema',
            message: error.message
        });
    }
});

// Endpoint para verificar integridad de la base de datos
app.get('/api/integrity', async (req, res) => {
    try {
        const { default: databaseRepository } = await import('./repositories/index.js');
        const integrity = await databaseRepository.checkDatabaseIntegrity();
        res.json(integrity);
    } catch (error) {
        console.error('Error verificando integridad:', error);
        res.status(500).json({
            error: 'Error verificando integridad de la base de datos',
            message: error.message
        });
    }
});

// Configurar rutas de la API

// Montar rutas QR PRIMERO para evitar conflictos
app.use('/api/qr', qrRoutes);

// Montar ruta de depuración para logs del frontend
app.use('/api/debug', debugRoutes);

// Ruta de prueba directa para QR
app.get('/api/qr-test-direct', (req, res) => {
    res.json({ 
        message: 'Ruta QR directa funcionando', 
        timestamp: new Date().toISOString()
    });
});

// Montar el resto de rutas
app.use('/api', authRoutes);

app.use('/api', taskRoutes);

app.use('/api/recuperacion', recuperacionRoutes);

app.use('/api/carga', cargaRoutes);

// Iniciar tareas de limpieza programadas
CleanupTasks.startAll();

// Manejar cierre graceful de la aplicación
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    CleanupTasks.stopAll();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    CleanupTasks.stopAll();
    process.exit(0);
});

export default app;