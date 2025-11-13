// services/base.service.js
// Clase base para servicios especializados
import { Config } from "../config.js";

/**
 * Clase base para servicios de negocio
 * Proporciona funcionalidades comunes y utilidades
 */
export class BaseService {
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.config = Config;
        this.logger = this.createLogger();
    }

    /**
     * Crear logger específico para el servicio
     */
    createLogger() {
        return {
            info: (message, data = null) => {
                if (this.config.isDevelopment()) {
                    console.log(`[${this.serviceName}] ℹ️ ${message}`, data ? data : '');
                }
            },
            
            warn: (message, data = null) => {
                console.warn(`[${this.serviceName}] ⚠️ ${message}`, data ? data : '');
            },
            
            error: (message, error = null) => {
                console.error(`[${this.serviceName}] ❌ ${message}`, error ? error : '');
            },
            
            success: (message, data = null) => {
                if (this.config.isDevelopment()) {
                    console.log(`[${this.serviceName}] ✅ ${message}`, data ? data : '');
                }
            },
            
            debug: (message, data = null) => {
                if (this.config.isDevelopment()) {
                    console.debug(`[${this.serviceName}] 🔍 ${message}`, data ? data : '');
                }
            }
        };
    }

    /**
     * Manejar errores de forma consistente
     */
    handleError(error, context = '') {
        const errorMessage = `${context ? context + ': ' : ''}${error.message}`;
        this.logger.error(errorMessage, error);
        
        // En desarrollo, mostrar stack trace
        if (this.config.isDevelopment() && error.stack) {
            console.error(`[${this.serviceName}] Stack trace:`, error.stack);
        }
        
        throw new Error(errorMessage);
    }

    /**
     * Validar parámetros requeridos
     */
    validateRequiredParams(params, requiredFields) {
        const missing = requiredFields.filter(field => 
            params[field] === undefined || params[field] === null
        );
        
        if (missing.length > 0) {
            throw new Error(`Parámetros requeridos faltantes: ${missing.join(', ')}`);
        }
    }

    /**
     * Generar ID único para operaciones
     */
    generateOperationId() {
        return `${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Medir tiempo de ejecución de operaciones
     */
    async measureExecutionTime(operationName, operation) {
        const startTime = Date.now();
        
        try {
            const result = await operation();
            const executionTime = Date.now() - startTime;
            
            this.logger.info(`${operationName} completado en ${executionTime}ms`);
            
            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`${operationName} falló después de ${executionTime}ms`, error);
            throw error;
        }
    }

    /**
     * Retry automático para operaciones
     */
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    this.logger.error(`Operación falló después de ${maxRetries} intentos`, error);
                    break;
                }
                
                this.logger.warn(`Intento ${attempt} falló, reintentando en ${delay}ms...`, error.message);
                await this.sleep(delay);
                delay *= 2; // Exponential backoff
            }
        }
        
        throw lastError;
    }

    /**
     * Función de espera
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar formato de teléfono
     */
    isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Sanitizar datos de entrada
     */
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input.trim().replace(/[<>]/g, '');
        }
        return input;
    }

    /**
     * Formatear fecha para logs
     */
    formatDate(date = new Date()) {
        return date.toISOString();
    }

    /**
     * Generar hash simple para identificadores
     */
    generateHash(input) {
        let hash = 0;
        if (input.length === 0) return hash;
        
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a entero de 32 bits
        }
        
        return Math.abs(hash).toString(36);
    }

    /**
     * Verificar si un feature está habilitado
     */
    isFeatureEnabled(featureName) {
        return this.config.isFeatureEnabled(featureName);
    }

    /**
     * Obtener configuración del servicio
     */
    getServiceConfig(configKey) {
        return this.config.get(configKey);
    }

    /**
     * Crear respuesta estándar de servicio
     */
    createServiceResponse(success = true, data = null, message = '', metadata = {}) {
        return {
            success,
            data,
            message,
            metadata: {
                ...metadata,
                service: this.serviceName,
                timestamp: this.formatDate(),
                operationId: this.generateOperationId()
            }
        };
    }

    /**
     * Crear respuesta de error estándar
     */
    createErrorResponse(error, context = '') {
        return this.createServiceResponse(
            false,
            null,
            `${context ? context + ': ' : ''}${error.message}`,
            {
                error: error.name || 'ServiceError',
                stack: this.config.isDevelopment() ? error.stack : undefined
            }
        );
    }
}

export default BaseService;
