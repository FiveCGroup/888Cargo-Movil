// middlewares/dataSanitization.middleware.fixed.js
// Versión corregida del middleware de sanitización

import validator from 'validator';

/**
 * Configuración de sanitización por tipo de campo - versión simplificada
 */
const SANITIZATION_RULES = {
    email: {
        sanitize: (value) => {
            try {
                return validator.normalizeEmail(value, {
                    all_lowercase: true,
                    gmail_remove_dots: false,
                    gmail_remove_subaddress: false
                }) || value.toLowerCase().trim();
            } catch (error) {
                return value.toLowerCase().trim();
            }
        },
        validate: (value) => {
            try {
                return validator.isEmail(value);
            } catch (error) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            }
        }
    },
    phone: {
        sanitize: (value) => String(value).replace(/[^\d+\-\s()]/g, '').trim(),
        validate: (value) => /^[\d+\-\s()]{7,20}$/.test(value)
    },
    name: {
        sanitize: (value) => String(value).trim().slice(0, 100),
        validate: (value) => value.length >= 1 && value.length <= 100
    },
    password: {
        sanitize: (value) => String(value), // NO modificar contraseñas
        validate: (value) => value.length >= 6 && value.length <= 255
    },
    text: {
        sanitize: (value) => String(value).trim().slice(0, 1000),
        validate: (value) => value.length <= 1000
    },
    country: {
        sanitize: (value) => String(value).trim().slice(0, 100),
        validate: (value) => value.length >= 1 && value.length <= 100
    }
};

/**
 * Middleware de sanitización simplificado y robusto
 */
export const sanitizeRequest = (fieldRules = {}) => {
    return (req, res, next) => {
        try {
            console.log('🧹 Sanitizing request:', {
                method: req.method,
                path: req.path,
                body: req.body
            });

            // Solo sanitizar si hay body
            if (req.body && typeof req.body === 'object') {
                req.body = sanitizeObject(req.body, fieldRules);
            }

            console.log('✅ Sanitization completed:', req.body);
            next();
        } catch (error) {
            console.error('❌ Error en sanitización:', error);
            // En caso de error, NO fallar - continuar sin sanitización
            next();
        }
    };
};

/**
 * Sanitizar un objeto de manera segura
 */
function sanitizeObject(obj, fieldRules) {
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
        try {
            if (value === null || value === undefined) {
                sanitized[key] = value;
                continue;
            }

            // Obtener reglas para este campo
            const fieldRule = fieldRules[key] || detectFieldType(key, value);
            
            // Sanitizar el valor
            sanitized[key] = sanitizeValue(value, fieldRule);
        } catch (error) {
            console.warn(`⚠️ Error sanitizando campo ${key}:`, error.message);
            // En caso de error, mantener el valor original
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Sanitizar un valor individual de manera segura
 */
function sanitizeValue(value, rule) {
    try {
        if (!rule || !rule.sanitize) {
            return value;
        }

        const sanitized = rule.sanitize(value);
        
        // Validar solo si hay función de validación
        if (rule.validate && !rule.validate(sanitized)) {
            console.warn(`⚠️ Valor no válido después de sanitización:`, { original: value, sanitized });
        }

        return sanitized;
    } catch (error) {
        console.warn('⚠️ Error en sanitización de valor:', error.message);
        return value; // Retornar valor original en caso de error
    }
}

/**
 * Detectar tipo de campo automáticamente
 */
function detectFieldType(fieldName, value) {
    const name = fieldName.toLowerCase();
    
    if (name.includes('email') || name.includes('correo')) {
        return SANITIZATION_RULES.email;
    }
    if (name.includes('phone') || name.includes('telefono')) {
        return SANITIZATION_RULES.phone;
    }
    if (name.includes('name') || name.includes('nombre') || name.includes('firstname') || name.includes('lastname')) {
        return SANITIZATION_RULES.name;
    }
    if (name.includes('password') || name.includes('contraseña')) {
        return SANITIZATION_RULES.password;
    }
    if (name.includes('country') || name.includes('pais')) {
        return SANITIZATION_RULES.country;
    }

    // Por defecto, tratar como texto
    return SANITIZATION_RULES.text;
}

/**
 * Middleware para logging de sanitización
 */
export const logSanitization = (req, res, next) => {
    console.log('📝 Request processed:', {
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
    });
    next();
};

/**
 * Reglas específicas para registro de usuario
 */
export const userRegistrationRules = {
    name: SANITIZATION_RULES.name,
    lastname: SANITIZATION_RULES.name,
    email: SANITIZATION_RULES.email,
    phone: SANITIZATION_RULES.phone,
    country: SANITIZATION_RULES.country,
    password: SANITIZATION_RULES.password
};

export default { sanitizeRequest, logSanitization, userRegistrationRules };
