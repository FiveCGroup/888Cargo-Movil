// config/environments.js
// Configuración por ambientes
export const environments = {
    development: {
        server: {
            port: process.env.PORT || 4000,
            host: process.env.HOST || '0.0.0.0',
            enableLogging: process.env.ENABLE_LOGGING === 'true',
            logLevel: process.env.LOG_LEVEL || 'debug'
        },
        database: {
            type: 'sqlite',
            path: process.env.DATABASE_PATH || './db/packing_list.db',
            enableLogging: true,
            connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10)
        },
        security: {
            tokenSecret: process.env.TOKEN_SECRET || 'dev_secret_key_888cargo',
            tokenExpiration: process.env.TOKEN_EXPIRATION || '24h',
            passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10),
            enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
            rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
            rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || (15 * 60 * 1000), 10)
        },
        cors: {
            origins: [
                process.env.FRONTEND_URL || 'http://localhost:5173',
                process.env.ADMIN_URL || 'http://localhost:5174'
            ].filter(Boolean),
            credentials: true,
            optionsSuccessStatus: 200
        },
        uploads: {
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || (50 * 1024 * 1024), 10),
            allowedMimeTypes: [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ],
            uploadPath: process.env.UPLOAD_PATH || './uploads',
            qrCodesPath: process.env.QR_CODES_PATH || './uploads/qr-codes',
            imagesPath: process.env.IMAGES_PATH || './uploads/images'
        },
        external: {
            whatsapp: {
                enabled: process.env.WHATSAPP_ENABLED === 'true',
                instanceId: process.env.WHATSAPP_INSTANCE_ID,
                token: process.env.WHATSAPP_TOKEN,
                fromNumber: process.env.WHATSAPP_FROM,
                baseUrl: process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com/v18.0',
                phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
                timeout: parseInt(process.env.WHATSAPP_TIMEOUT || '30000', 10)
            },
            email: {
                enabled: process.env.EMAIL_ENABLED === 'true' || process.env.EMAIL_NOTIFICATIONS === 'true',
                service: process.env.EMAIL_SERVICE || process.env.EMAIL_PROVIDER || 'gmail',
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASSWORD,
                from: process.env.EMAIL_FROM || 'noreply@888cargo.com'
            }
        },
        features: {
            enableQRGeneration: process.env.ENABLE_QR_GENERATION === 'true',
            enablePDFGeneration: process.env.ENABLE_PDF_GENERATION === 'true',
            enableWhatsAppRecovery: process.env.ENABLE_WHATSAPP_RECOVERY === 'true',
            enableEmailNotifications: process.env.EMAIL_NOTIFICATIONS === 'true',
            enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true',
            enableCaching: process.env.ENABLE_CACHING === 'true'
        }
    },

    test: {
        // igual que antes...
    },

    production: {
        // igual que antes...
    }
};

/**
 * Obtener configuración del ambiente actual
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
 */
export function getConfigSection(section) {
    const config = getCurrentEnvironmentConfig();
    return config[section] || {};
}

/**
 * Verificar si una feature está habilitada
 */
export function isFeatureEnabled(featureName) {
    const features = getConfigSection('features');
    return features[featureName] || false;
}

/**
 * Validar configuración requerida
 */
export function validateRequiredConfig() {
    const config = getCurrentEnvironmentConfig();
    const env = process.env.NODE_ENV || 'development';

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