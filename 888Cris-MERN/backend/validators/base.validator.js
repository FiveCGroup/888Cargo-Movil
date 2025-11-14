// validators/base.validator.js
// Validador base con funcionalidades comunes
import { z } from "zod";

export class BaseValidator {
    
    /**
     * Formatear errores de Zod de manera consistente
     * @param {Object} error - Error de Zod
     * @returns {string} - Mensaje de error formateado
     */
    static formatZodError(error) {
        if (error.errors && Array.isArray(error.errors)) {
            return error.errors.map(err => err.message).join(', ');
        }
        return error.message || "Error de validación";
    }

    /**
     * Validar que un ID es un entero positivo
     * @param {any} id - ID a validar
     * @param {string} fieldName - Nombre del campo para el error
     * @returns {number} - ID validado
     * @throws {Error} - Error de validación
     */
    static validateId(id, fieldName = "ID") {
        const parsedId = parseInt(id);
        if (isNaN(parsedId) || parsedId <= 0) {
            throw new Error(`${fieldName} debe ser un número positivo`);
        }
        return parsedId;
    }

    /**
     * Validar formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} - True si es válido
     * @throws {Error} - Error de validación
     */
    static validateEmail(email) {
        if (!email || typeof email !== 'string') {
            throw new Error('Email es requerido');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Formato de email inválido');
        }

        return true;
    }

    /**
     * Validar formato de teléfono
     * @param {string} phone - Teléfono a validar
     * @returns {boolean} - True si es válido
     * @throws {Error} - Error de validación
     */
    static validatePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            throw new Error('Número de teléfono es requerido');
        }

        const normalizedPhone = phone.replace(/\s+/g, '');
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        
        if (!phoneRegex.test(normalizedPhone)) {
            throw new Error('Formato de teléfono inválido (ej: +573001112233)');
        }

        return true;
    }

    /**
     * Normalizar número de teléfono
     * @param {string} phone - Teléfono a normalizar
     * @returns {string} - Teléfono normalizado
     */
    static normalizePhone(phone) {
        return phone.replace(/\s+/g, '').replace('+', '');
    }

    /**
     * Validar contraseña con reglas de seguridad
     * @param {string} password - Contraseña a validar
     * @param {Object} options - Opciones de validación
     * @returns {boolean} - True si es válida
     * @throws {Error} - Error de validación
     */
    static validatePassword(password, options = {}) {
        const {
            minLength = 6,
            requireLetters = true,
            requireNumbers = true,
            requireSpecialChars = false
        } = options;

        if (!password || typeof password !== 'string') {
            throw new Error('Contraseña es requerida');
        }

        if (password.length < minLength) {
            throw new Error(`La contraseña debe tener al menos ${minLength} caracteres`);
        }

        if (requireLetters && !/[A-Za-z]/.test(password)) {
            throw new Error('La contraseña debe contener al menos una letra');
        }

        if (requireNumbers && !/[0-9]/.test(password)) {
            throw new Error('La contraseña debe contener al menos un número');
        }

        if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            throw new Error('La contraseña debe contener al menos un carácter especial');
        }

        return true;
    }

    /**
     * Validar fecha
     * @param {string|Date} dateInput - Fecha a validar
     * @returns {Date} - Fecha validada
     * @throws {Error} - Error de validación
     */
    static validateDate(dateInput, fieldName = "Fecha") {
        let date;
        
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        } else {
            throw new Error(`${fieldName} debe ser una fecha válida`);
        }

        if (isNaN(date.getTime())) {
            throw new Error(`${fieldName} inválida`);
        }

        return date;
    }

    /**
     * Validar que un string no esté vacío
     * @param {string} value - Valor a validar
     * @param {string} fieldName - Nombre del campo
     * @param {number} minLength - Longitud mínima
     * @param {number} maxLength - Longitud máxima
     * @returns {string} - Valor validado y trimmeado
     * @throws {Error} - Error de validación
     */
    static validateString(value, fieldName, minLength = 1, maxLength = 255) {
        if (!value || typeof value !== 'string') {
            throw new Error(`${fieldName} es requerido`);
        }

        const trimmedValue = value.trim();
        
        if (trimmedValue.length < minLength) {
            throw new Error(`${fieldName} debe tener al menos ${minLength} caracteres`);
        }

        if (trimmedValue.length > maxLength) {
            throw new Error(`${fieldName} no puede exceder ${maxLength} caracteres`);
        }

        return trimmedValue;
    }

    /**
     * Validar que un valor esté dentro de opciones permitidas
     * @param {any} value - Valor a validar
     * @param {Array} allowedValues - Valores permitidos
     * @param {string} fieldName - Nombre del campo
     * @returns {any} - Valor validado
     * @throws {Error} - Error de validación
     */
    static validateEnum(value, allowedValues, fieldName) {
        if (!allowedValues.includes(value)) {
            throw new Error(`${fieldName} inválido. Valores permitidos: ${allowedValues.join(', ')}`);
        }
        return value;
    }

    /**
     * Validar objeto usando schema de Zod
     * @param {Object} data - Datos a validar
     * @param {z.ZodSchema} schema - Schema de Zod
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateWithZod(data, schema) {
        try {
            return schema.parse(data);
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar parámetros de URL
     * @param {Object} params - Parámetros de la URL
     * @param {Array} requiredParams - Parámetros requeridos
     * @returns {Object} - Parámetros validados
     * @throws {Error} - Error de validación
     */
    static validateUrlParams(params, requiredParams = []) {
        const validatedParams = {};

        for (const param of requiredParams) {
            if (!params[param]) {
                throw new Error(`Parámetro requerido faltante: ${param}`);
            }
            
            // Si el parámetro termina en 'id', validarlo como ID
            if (param.toLowerCase().includes('id')) {
                validatedParams[param] = this.validateId(params[param], param);
            } else {
                validatedParams[param] = params[param];
            }
        }

        // Agregar parámetros opcionales si están presentes
        for (const [key, value] of Object.entries(params)) {
            if (!requiredParams.includes(key) && value !== undefined) {
                if (key.toLowerCase().includes('id')) {
                    validatedParams[key] = this.validateId(value, key);
                } else {
                    validatedParams[key] = value;
                }
            }
        }

        return validatedParams;
    }

    /**
     * Sanitizar input para prevenir inyecciones
     * @param {string} input - Input a sanitizar
     * @returns {string} - Input sanitizado
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validar que los campos requeridos estén presentes
     * @param {Object} data - Datos a validar
     * @param {Array} requiredFields - Campos requeridos
     * @throws {Error} - Error si falta algún campo
     */
    static validateRequiredFields(data, requiredFields) {
        const missingFields = [];

        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
        }
    }

    /**
     * Validar que solo se proporcionen campos permitidos
     * @param {Object} data - Datos a validar
     * @param {Array} allowedFields - Campos permitidos
     * @throws {Error} - Error si hay campos no permitidos
     */
    static validateAllowedFields(data, allowedFields) {
        const providedFields = Object.keys(data);
        const invalidFields = providedFields.filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            throw new Error(`Campos no permitidos: ${invalidFields.join(', ')}`);
        }
    }
}
