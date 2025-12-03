// config/environments.js
// Configuración por ambientes
export const environments = {
    development: {
        server: {
            port: 4000,
            host: '0.0.0.0',
            enableLogging: true,
            logLevel: 'debug'
        },
        database: {
            type: 'sqlite',
            path: '../db/packing_list.db',
            enableLogging: true,
            connectionTimeout: 5000,
            maxConnections: 10
        },
        security: {
            tokenSecret: 'dev_secret_key_888cargo',
            tokenExpiration: '24h',
            passwordSaltRounds: 10,
            enableRateLimit: false,
            rateLimitMax: 100,
            rateLimitWindow: 15 * 60 * 1000 // 15 minutos
        },
        cors: {
            origins: [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:5174',
                'http://192.168.58.103:4000',
                'http://10.0.2.2:4000',
                'exp://192.168.58.106:8081',
                'http://172.22.192.1:8081',  // Tu IP local - Expo
                'exp://172.22.192.1:8081'
            ],
            credentials: true,
            optionsSuccessStatus: 200
        },
        uploads: {
            maxFileSize: 50 * 1024 * 1024, // Aumentar a 50MB para Excel con imágenes
            allowedMimeTypes: [
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'image/gif',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
                'application/vnd.ms-excel' // Excel .xls
            ],
            uploadPath: './uploads',
            qrCodesPath: './uploads/qr-codes',
            imagesPath: './uploads/images'
        },
        external: {
            whatsapp: {
                enabled: true,
                instanceId: process.env.WHATSAPP_INSTANCE_ID || 'dev_instance',
                token: process.env.WHATSAPP_TOKEN || 'dev_token',
                fromNumber: process.env.WHATSAPP_FROM || '+573001234567',
                baseUrl: 'https://api.whatsapp.com/v1',
                timeout: 30000
            },
            email: {
                enabled: false,
                service: 'gmail',
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASSWORD,
                from: process.env.EMAIL_FROM || 'noreply@888cargo.com'
            }
        },
        features: {
            enableQRGeneration: true,
            enablePDFGeneration: true,
            enableWhatsAppRecovery: true,
            enableEmailNotifications: false,
            enableAuditLog: true,
            enableCaching: false
        }
    },

    test: {
        server: {
            port: 4001,
            host: '127.0.0.1',
            enableLogging: false,
            logLevel: 'error'
        },
        database: {
            type: 'sqlite',
            path: ':memory:', // Base de datos en memoria para tests
            enableLogging: false,
            connectionTimeout: 2000,
            maxConnections: 5
        },
        security: {
            tokenSecret: 'test_secret_key_888cargo_testing',
            tokenExpiration: '1h',
            passwordSaltRounds: 6, // Más rápido para tests
            enableRateLimit: false,
            rateLimitMax: 1000,
            rateLimitWindow: 60 * 1000
        },
        cors: {
            origins: ['http://localhost:3000'],
            credentials: true,
            optionsSuccessStatus: 200
        },
        uploads: {
            maxFileSize: 1 * 1024 * 1024, // 1MB para tests
            allowedMimeTypes: ['image/png', 'image/jpeg'],
            uploadPath: './test-uploads',
            qrCodesPath: './test-uploads/qr-codes',
            imagesPath: './test-uploads/images'
        },
        external: {
            whatsapp: {
                enabled: false, // Deshabilitado en tests
                instanceId: 'test_instance',
                token: 'test_token',
                fromNumber: '+1234567890',
                baseUrl: 'http://localhost:3001/mock-whatsapp',
                timeout: 5000
            },
            email: {
                enabled: false,
                service: 'test',
                user: 'test@test.com',
                password: 'test',
                from: 'test@888cargo.com'
            }
        },
        features: {
            enableQRGeneration: true,
            enablePDFGeneration: true,
            enableWhatsAppRecovery: false,
            enableEmailNotifications: false,
            enableAuditLog: false,
            enableCaching: false
        }
    },

    production: {
        server: {
            port: process.env.PORT || 8000,
            host: '0.0.0.0',
            enableLogging: true,
            logLevel: 'info'
        },
        database: {
            type: 'sqlite',
            path: process.env.DATABASE_PATH || './db/production.db',
            enableLogging: false,
            connectionTimeout: 10000,
            maxConnections: 20
        },
        security: {
            tokenSecret: process.env.TOKEN_SECRET,
            tokenExpiration: '8h',
            passwordSaltRounds: 12,
            enableRateLimit: true,
            rateLimitMax: 100,
            rateLimitWindow: 15 * 60 * 1000
        },
        cors: {
            origins: [
                process.env.FRONTEND_URL,
                process.env.ADMIN_URL
            ].filter(Boolean),
            credentials: true,
            optionsSuccessStatus: 200
        },
        uploads: {
            maxFileSize: 50 * 1024 * 1024, // 50MB
            allowedMimeTypes: [
                'image/jpeg',
                'image/jpg',
                'image/png', 
                'image/gif',
                'application/pdf'
            ],
            uploadPath: process.env.UPLOAD_PATH || './uploads',
            qrCodesPath: process.env.QR_CODES_PATH || './uploads/qr-codes',
            imagesPath: process.env.IMAGES_PATH || './uploads/images'
        },
        external: {
            whatsapp: {
                enabled: true,
                instanceId: process.env.WHATSAPP_INSTANCE_ID,
                token: process.env.WHATSAPP_TOKEN,
                fromNumber: process.env.WHATSAPP_FROM,
                baseUrl: process.env.WHATSAPP_BASE_URL || 'https://api.whatsapp.com/v1',
                timeout: 30000
            },
            email: {
                enabled: process.env.EMAIL_ENABLED === 'true',
                service: process.env.EMAIL_SERVICE || 'gmail',
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASSWORD,
                from: process.env.EMAIL_FROM
            }
        },
        features: {
            enableQRGeneration: true,
            enablePDFGeneration: true,
            enableWhatsAppRecovery: true,
            enableEmailNotifications: process.env.EMAIL_NOTIFICATIONS === 'true',
            enableAuditLog: true,
            enableCaching: process.env.ENABLE_CACHING === 'true'
        }
    }
};

/**
 * Obtener configuración del ambiente actual
 * @returns {Object} - Configuración del ambiente
 */
export function getCurrentEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    if (!environments[env]) {
        console.warn(`⚠️ Ambiente '${env}' no encontrado, usando 'development'`);
        return environments.development;
    }
    
    return environments[env];
}

/**
 * Obtener configuración específica de una sección
 * @param {string} section - Sección de configuración
 * @returns {Object} - Configuración de la sección
 */
export function getConfigSection(section) {
    const config = getCurrentEnvironmentConfig();
    return config[section] || {};
}

/**
 * Verificar si una feature está habilitada
 * @param {string} featureName - Nombre de la feature
 * @returns {boolean} - True si está habilitada
 */
export function isFeatureEnabled(featureName) {
    const features = getConfigSection('features');
    return features[featureName] || false;
}

/**
 * Validar configuración requerida
 * @throws {Error} - Si falta configuración crítica
 */
export function validateRequiredConfig() {
    const config = getCurrentEnvironmentConfig();
    const env = process.env.NODE_ENV || 'development';
    
    // Validaciones críticas para producción
    if (env === 'production') {
        if (!config.security.tokenSecret || config.security.tokenSecret === 'some_secret_key') {
            throw new Error('TOKEN_SECRET es requerido y debe ser seguro en producción');
        }
        
        if (config.external.whatsapp.enabled && !config.external.whatsapp.token) {
            throw new Error('WHATSAPP_TOKEN es requerido cuando WhatsApp está habilitado');
        }
        
        if (config.features.enableEmailNotifications && !config.external.email.user) {
            throw new Error('EMAIL_USER es requerido cuando las notificaciones están habilitadas');
        }
    }
    
    console.log(`✅ Configuración validada para ambiente: ${env}`);
}
