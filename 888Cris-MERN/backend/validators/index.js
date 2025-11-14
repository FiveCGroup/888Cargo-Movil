// validators/index.js
// Índice central de todos los validadores
export { BaseValidator } from './base.validator.js';
export { AuthValidator } from './auth.validator.js';
export { TaskValidator } from './task.validator.js';
export { RecuperacionValidator } from './recuperacion.validator.js';
export { QRValidator } from './qr.validator.js';

// Tipos de validación comunes
export const ValidationTypes = {
    REQUIRED: 'required',
    OPTIONAL: 'optional',
    EMAIL: 'email',
    PHONE: 'phone',
    PASSWORD: 'password',
    ID: 'id',
    DATE: 'date',
    ENUM: 'enum'
};

// Constantes de validación
export const ValidationConstants = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 100,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 1000,
    MAX_TITLE_LENGTH: 255,
    MAX_EMAIL_LENGTH: 100,
    PHONE_REGEX: /^\+?[0-9]{10,15}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_BATCH_SIZE: 50,
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
};

// Mensajes de error estándar
export const ValidationMessages = {
    REQUIRED: (field) => `${field} es requerido`,
    INVALID_EMAIL: 'Formato de email inválido',
    INVALID_PHONE: 'Formato de teléfono inválido (ej: +573001112233)',
    WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres y contener letras y números',
    INVALID_ID: (field) => `${field} debe ser un número positivo`,
    INVALID_DATE: (field) => `${field} debe ser una fecha válida`,
    MAX_LENGTH: (field, max) => `${field} no puede exceder ${max} caracteres`,
    MIN_LENGTH: (field, min) => `${field} debe tener al menos ${min} caracteres`,
    INVALID_ENUM: (field, values) => `${field} debe ser uno de: ${values.join(', ')}`,
    NO_UPDATE_DATA: 'No se proporcionaron datos para actualizar',
    UNAUTHORIZED: 'No autorizado para realizar esta acción',
    NOT_FOUND: (resource) => `${resource} no encontrado`,
    ALREADY_EXISTS: (resource) => `${resource} ya existe`,
    EXPIRED_TOKEN: 'Token expirado, solicite uno nuevo',
    INVALID_TOKEN: 'Token inválido'
};

// Funciones de utilidad para validación
export const ValidationUtils = {
    /**
     * Crear mensaje de error personalizado
     * @param {string} field - Campo que falló
     * @param {string} type - Tipo de validación
     * @param {any} value - Valor adicional para el mensaje
     * @returns {string} - Mensaje de error
     */
    createErrorMessage(field, type, value = null) {
        switch (type) {
            case ValidationTypes.REQUIRED:
                return ValidationMessages.REQUIRED(field);
            case ValidationTypes.EMAIL:
                return ValidationMessages.INVALID_EMAIL;
            case ValidationTypes.PHONE:
                return ValidationMessages.INVALID_PHONE;
            case ValidationTypes.PASSWORD:
                return ValidationMessages.WEAK_PASSWORD;
            case ValidationTypes.ID:
                return ValidationMessages.INVALID_ID(field);
            case ValidationTypes.DATE:
                return ValidationMessages.INVALID_DATE(field);
            case ValidationTypes.ENUM:
                return ValidationMessages.INVALID_ENUM(field, value);
            default:
                return `Error de validación en ${field}`;
        }
    },

    /**
     * Validar múltiples campos a la vez
     * @param {Object} data - Datos a validar
     * @param {Array} rules - Reglas de validación
     * @returns {Object} - Resultado de la validación
     */
    validateMultiple(data, rules) {
        const errors = [];
        const validatedData = {};

        for (const rule of rules) {
            const { field, type, required = false, options = {} } = rule;
            const value = data[field];

            try {
                if (required && (value === undefined || value === null || value === '')) {
                    errors.push(this.createErrorMessage(field, ValidationTypes.REQUIRED));
                    continue;
                }

                if (value !== undefined && value !== null && value !== '') {
                    switch (type) {
                        case ValidationTypes.EMAIL:
                            if (!ValidationConstants.EMAIL_REGEX.test(value)) {
                                errors.push(this.createErrorMessage(field, ValidationTypes.EMAIL));
                            } else {
                                validatedData[field] = value.toLowerCase().trim();
                            }
                            break;

                        case ValidationTypes.PHONE:
                            if (!ValidationConstants.PHONE_REGEX.test(value.replace(/\s+/g, ''))) {
                                errors.push(this.createErrorMessage(field, ValidationTypes.PHONE));
                            } else {
                                validatedData[field] = value.replace(/\s+/g, '').replace('+', '');
                            }
                            break;

                        case ValidationTypes.ID:
                            const id = parseInt(value);
                            if (isNaN(id) || id <= 0) {
                                errors.push(this.createErrorMessage(field, ValidationTypes.ID));
                            } else {
                                validatedData[field] = id;
                            }
                            break;

                        case ValidationTypes.ENUM:
                            if (!options.values || !options.values.includes(value)) {
                                errors.push(this.createErrorMessage(field, ValidationTypes.ENUM, options.values));
                            } else {
                                validatedData[field] = value;
                            }
                            break;

                        default:
                            validatedData[field] = value;
                    }
                } else if (!required) {
                    validatedData[field] = value;
                }
            } catch (error) {
                errors.push(`Error validando ${field}: ${error.message}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: validatedData
        };
    },

    /**
     * Sanitizar objeto completo
     * @param {Object} obj - Objeto a sanitizar
     * @param {Array} excludeFields - Campos a excluir de la sanitización
     * @returns {Object} - Objeto sanitizado
     */
    sanitizeObject(obj, excludeFields = []) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (excludeFields.includes(key)) {
                sanitized[key] = value;
            } else if (typeof value === 'string') {
                sanitized[key] = value
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
};
