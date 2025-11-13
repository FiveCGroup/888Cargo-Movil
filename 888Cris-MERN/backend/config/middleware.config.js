// config/middleware.config.js
// Configuración centralizada de middleware
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import { 
    CORS_CONFIG, 
    SERVER_CONFIG, 
    SECURITY_CONFIG,
    Config 
} from "../config.js";

/**
 * Configuración de logging con Morgan
 */
export function configureLogging(app) {
    if (SERVER_CONFIG.enableLogging) {
        const format = Config.isDevelopment() 
            ? 'dev'
            : 'combined';
            
        app.use(morgan(format));
        
        if (Config.isDevelopment()) {
            console.log('📝 Logging habilitado en modo:', format);
        }
    }
}

/**
 * Configuración de CORS
 */
export function configureCORS(app) {
    const corsOptions = {
        origin: (origin, callback) => {
            // Permitir requests sin origin (móviles, Postman, etc.)
            if (!origin) return callback(null, true);
            
            if (CORS_CONFIG.origins.includes(origin)) {
                callback(null, true);
            } else {
                const msg = `CORS: Origen ${origin} no permitido`;
                console.warn('⚠️', msg);
                callback(new Error(msg));
            }
        },
        credentials: CORS_CONFIG.credentials,
        optionsSuccessStatus: CORS_CONFIG.optionsSuccessStatus,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin'
        ]
    };

    app.use(cors(corsOptions));
    
    if (Config.isDevelopment()) {
        console.log('🌐 CORS configurado para:', CORS_CONFIG.origins);
    }
}

/**
 * Configuración de Rate Limiting
 */
export function configureRateLimit(app) {
    if (SECURITY_CONFIG.enableRateLimit) {
        const limiter = rateLimit({
            windowMs: SECURITY_CONFIG.rateLimitWindow,
            max: SECURITY_CONFIG.rateLimitMax,
            message: {
                error: 'Demasiadas peticiones desde esta IP',
                resetTime: new Date(Date.now() + SECURITY_CONFIG.rateLimitWindow)
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                console.warn(`🚫 Rate limit excedido para IP: ${req.ip}`);
                res.status(429).json({
                    error: 'Demasiadas peticiones',
                    message: 'Por favor, intente nuevamente más tarde',
                    resetTime: new Date(Date.now() + SECURITY_CONFIG.rateLimitWindow)
                });
            }
        });

        app.use('/api/', limiter);
        
        console.log(`🛡️ Rate limiting habilitado: ${SECURITY_CONFIG.rateLimitMax} req/${SECURITY_CONFIG.rateLimitWindow}ms`);
    }
}

/**
 * Configuración de Helmet para seguridad
 */
export function configureSecurity(app) {
    // Configuración básica de Helmet
    const helmetConfig = {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false, // Para desarrollo
        hsts: Config.isProduction() ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        } : false
    };

    app.use(helmet(helmetConfig));
    
    if (Config.isDevelopment()) {
        console.log('🔒 Helmet configurado para seguridad básica');
    }
}

/**
 * Configuración de compresión
 */
export function configureCompression(app) {
    if (Config.isProduction()) {
        app.use(compression({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            threshold: 1024, // Solo comprimir archivos > 1KB
            level: 6 // Nivel de compresión balanceado
        }));
        
        console.log('📦 Compresión gzip habilitada');
    }
}

/**
 * Configuración de parsers básicos
 */
export function configureParsers(app) {
    // JSON parser con límite de tamaño
    app.use(express.json({ 
        limit: '10mb',
        type: 'application/json'
    }));
    
    // URL encoded parser
    app.use(express.urlencoded({ 
        extended: true, 
        limit: '10mb' 
    }));
    
    // Cookie parser
    app.use(cookieParser());
    
    if (Config.isDevelopment()) {
        console.log('🔧 Parsers configurados (JSON, URL-encoded, Cookies)');
    }
}

/**
 * Middleware personalizado para logging de requests
 */
export function configureCustomLogging(app) {
    if (Config.isDevelopment()) {
        app.use((req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const status = res.statusCode;
                const method = req.method;
                const url = req.originalUrl;
                
                const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
                const reset = '\x1b[0m';
                
                console.log(`${color}${method} ${url} ${status}${reset} - ${duration}ms`);
            });
            
            next();
        });
    }
}

/**
 * Middleware de manejo de errores personalizado
 */
export function configureErrorHandling(app) {
    // 404 Handler
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'Endpoint no encontrado',
            message: `La ruta ${req.method} ${req.originalUrl} no existe`,
            availableRoutes: [
                'GET /api/health',
                'POST /api/register',
                'POST /api/login',
                'GET /api/qr/test'
            ]
        });
    });

    // Error Handler Global
    app.use((error, req, res, next) => {
        console.error('❌ Error no manejado:', error);
        
        // Error de validación
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Error de validación',
                message: error.message,
                details: error.details || null
            });
        }
        
        // Error de JWT
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'El token de autenticación no es válido'
            });
        }
        
        // Error de token expirado
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                message: 'El token de autenticación ha expirado'
            });
        }
        
        // Error de CORS
        if (error.message && error.message.includes('CORS')) {
            return res.status(403).json({
                error: 'CORS Error',
                message: 'Origen no permitido por la política CORS'
            });
        }
        
        // Error genérico del servidor
        const statusCode = error.statusCode || error.status || 500;
        const message = Config.isProduction() 
            ? 'Error interno del servidor'
            : error.message || 'Error interno del servidor';
            
        res.status(statusCode).json({
            error: 'Error del servidor',
            message: message,
            ...(Config.isDevelopment() && { stack: error.stack })
        });
    });
    
    if (Config.isDevelopment()) {
        console.log('🚨 Manejo de errores configurado');
    }
}

/**
 * Aplicar toda la configuración de middleware
 */
export function applyAllMiddleware(app) {
    console.log('\n🔧 Configurando middleware...');
    
    // Orden importante: del más general al más específico
    configureSecurity(app);           // 1. Seguridad primero
    configureCompression(app);        // 2. Compresión
    configureLogging(app);            // 3. Logging
    configureCORS(app);               // 4. CORS
    configureRateLimit(app);          // 5. Rate limiting
    configureParsers(app);            // 6. Parsers
    configureCustomLogging(app);      // 7. Logging personalizado
    
    console.log('✅ Middleware configurado correctamente\n');
}

/**
 * Aplicar manejo de errores (debe ser al final)
 */
export function applyErrorHandling(app) {
    configureErrorHandling(app);
}
