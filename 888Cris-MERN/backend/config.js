// config.js
// Configuración principal del backend
import dotenv from 'dotenv';
import { 
    getCurrentEnvironmentConfig, 
    getConfigSection, 
    isFeatureEnabled,
    validateRequiredConfig 
} from './config/environments.js';

// Cargar variables de entorno
dotenv.config();

// Validar configuración al inicializar
try {
    validateRequiredConfig();
} catch (error) {
    console.error('❌ Error de configuración:', error.message);
    process.exit(1);
}

// Obtener configuración del ambiente actual
const envConfig = getCurrentEnvironmentConfig();

// Exportar configuraciones específicas
export const SERVER_CONFIG = getConfigSection('server');
export const DATABASE_CONFIG = getConfigSection('database');
export const SECURITY_CONFIG = getConfigSection('security');
export const CORS_CONFIG = getConfigSection('cors');
export const UPLOAD_CONFIG = getConfigSection('uploads');
export const EXTERNAL_CONFIG = getConfigSection('external');
export const FEATURES_CONFIG = getConfigSection('features');

// Configuraciones derivadas para compatibilidad
export const PORT = SERVER_CONFIG.port;
export const HOST = SERVER_CONFIG.host;
export const TOKEN_SECRET = SECURITY_CONFIG.tokenSecret;

// Configuración de base de datos para compatibilidad
export const DB_CONFIG = {
    type: DATABASE_CONFIG.type,
    path: DATABASE_CONFIG.path,
    connectionString: DATABASE_CONFIG.connectionString,
    ssl: DATABASE_CONFIG.ssl || { rejectUnauthorized: false },
    enableLogging: DATABASE_CONFIG.enableLogging,
    connectionTimeout: DATABASE_CONFIG.connectionTimeout,
    maxConnections: DATABASE_CONFIG.maxConnections
};

// Configuración de CORS para app.js
export const CORS_OPTIONS = {
    origin: CORS_CONFIG.origins,
    credentials: CORS_CONFIG.credentials,
    optionsSuccessStatus: CORS_CONFIG.optionsSuccessStatus
};

// Configuración de uploads
export const UPLOAD_PATHS = {
    base: UPLOAD_CONFIG.uploadPath,
    qrCodes: UPLOAD_CONFIG.qrCodesPath,
    images: UPLOAD_CONFIG.imagesPath
};

// Configuración de WhatsApp
export const WHATSAPP_CONFIG = {
    enabled: EXTERNAL_CONFIG.whatsapp?.enabled || false,
    instanceId: EXTERNAL_CONFIG.whatsapp?.instanceId,
    token: EXTERNAL_CONFIG.whatsapp?.token,
    fromNumber: EXTERNAL_CONFIG.whatsapp?.fromNumber,
    baseUrl: EXTERNAL_CONFIG.whatsapp?.baseUrl,
    timeout: EXTERNAL_CONFIG.whatsapp?.timeout || 30000
};

// Configuración de Email
export const EMAIL_CONFIG = {
    enabled: EXTERNAL_CONFIG.email?.enabled || false,
    service: EXTERNAL_CONFIG.email?.service,
    user: EXTERNAL_CONFIG.email?.user,
    password: EXTERNAL_CONFIG.email?.password,
    from: EXTERNAL_CONFIG.email?.from
};

// Utilidades de configuración
export const Config = {
    /**
     * Obtener configuración completa del ambiente
     */
    getEnvironmentConfig: () => envConfig,
    
    /**
     * Obtener ambiente actual
     */
    getEnvironment: () => process.env.NODE_ENV || 'development',
    
    /**
     * Verificar si una feature está habilitada
     */
    isFeatureEnabled: (featureName) => isFeatureEnabled(featureName),
    
    /**
     * Obtener configuración de una sección específica
     */
    getSection: (sectionName) => getConfigSection(sectionName),
    
    /**
     * Verificar si estamos en desarrollo
     */
    isDevelopment: () => (process.env.NODE_ENV || 'development') === 'development',
    
    /**
     * Verificar si estamos en producción
     */
    isProduction: () => process.env.NODE_ENV === 'production',
    
    /**
     * Verificar si estamos en testing
     */
    isTesting: () => process.env.NODE_ENV === 'test',
    
    /**
     * Obtener configuración de logging
     */
    getLoggingConfig: () => ({
        enabled: SERVER_CONFIG.enableLogging,
        level: SERVER_CONFIG.logLevel
    }),
    
    /**
     * Obtener configuración de rate limiting
     */
    getRateLimitConfig: () => ({
        enabled: SECURITY_CONFIG.enableRateLimit,
        max: SECURITY_CONFIG.rateLimitMax,
        windowMs: SECURITY_CONFIG.rateLimitWindow
    }),
    
    /**
     * Imprimir resumen de configuración
     */
    printSummary: () => {
        const env = Config.getEnvironment();
        console.log(`\n🔧 888Cargo Server - ${env.toUpperCase()}`);
        console.log(`🌐 ${SERVER_CONFIG.host}:${SERVER_CONFIG.port} | 🗃️ ${DATABASE_CONFIG.type}\n`);
    }
};

// Imprimir resumen en desarrollo
if (Config.isDevelopment()) {
    Config.printSummary();
}