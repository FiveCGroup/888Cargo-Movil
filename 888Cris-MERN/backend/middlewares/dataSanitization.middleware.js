// middlewares/dataSanitization.middleware.js
// Middleware para sanitización avanzada de datos de entrada

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuración de sanitización por tipo de campo
 */
const SANITIZATION_RULES = {
    email: {
        sanitize: (value) => validator.normalizeEmail(value, {
            all_lowercase: true,
            gmail_remove_dots: false,
            gmail_remove_subaddress: false
        }),
        validate: (value) => validator.isEmail(value)
    },
    phone: {
        sanitize: (value) => value.replace(/[^\d+\-\s()]/g, '').trim(),
        validate: (value) => /^[\d+\-\s()]{10,20}$/.test(value)
    },
    name: {
        sanitize: (value) => sanitizeText(value, { allowAccents: true, maxLength: 50 }),
        validate: (value) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(value)
    },
    username: {
        sanitize: (value) => value.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 30),
        validate: (value) => /^[a-z0-9_]{3,30}$/.test(value)
    },
    password: {
        sanitize: (value) => value.trim(), // No modificar mucho las contraseñas
        validate: (value) => value.length >= 6 && value.length <= 100
    },
    text: {
        sanitize: (value) => sanitizeText(value, { allowHtml: false, maxLength: 1000 }),
        validate: (value) => value.length <= 1000
    },
    html: {
        sanitize: (value) => DOMPurify.sanitize(value, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
            ALLOWED_ATTR: []
        }),
        validate: (value) => value.length <= 5000
    },
    url: {
        sanitize: (value) => value.trim().toLowerCase(),
        validate: (value) => validator.isURL(value, {
            protocols: ['http', 'https'],
            require_protocol: true
        })
    },
    number: {
        sanitize: (value) => {
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
        },
        validate: (value) => typeof value === 'number' && !isNaN(value)
    },
    integer: {
        sanitize: (value) => {
            const num = parseInt(value);
            return isNaN(num) ? null : num;
        },
        validate: (value) => Number.isInteger(value)
    },
    country: {
        sanitize: (value) => sanitizeText(value, { allowAccents: true, maxLength: 50 }),
        validate: (value) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(value)
    },
    city: {
        sanitize: (value) => sanitizeText(value, { allowAccents: true, maxLength: 50 }),
        validate: (value) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(value)
    }
};

/**
 * Middleware principal de sanitización
 */
export const sanitizeRequest = (fieldRules = {}) => {
    return (req, res, next) => {
        try {
            const sanitizationResults = {
                original: { ...req.body },
                sanitized: {},
                errors: [],
                warnings: []
            };

            // Sanitizar body
            if (req.body && typeof req.body === 'object') {
                req.body = sanitizeObject(req.body, fieldRules, sanitizationResults);
            }

            // Sanitizar query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = sanitizeObject(req.query, fieldRules, sanitizationResults, 'query');
            }

            // Sanitizar params
            if (req.params && typeof req.params === 'object') {
                req.params = sanitizeObject(req.params, fieldRules, sanitizationResults, 'params');
            }

            // Agregar resultados al request para logging
            req.sanitizationResults = sanitizationResults;

            // Si hay errores críticos, rechazar request
            const criticalErrors = sanitizationResults.errors.filter(e => e.severity === 'critical');
            if (criticalErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada no válidos',
                    errors: criticalErrors.map(e => e.message)
                });
            }

            next();
        } catch (error) {
            console.error('Error en sanitización:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno en procesamiento de datos'
            });
        }
    };
};

/**
 * Sanitizar un objeto recursivamente
 */
function sanitizeObject(obj, fieldRules, results, context = 'body') {
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
        try {
            // Obtener reglas para este campo
            const fieldRule = fieldRules[key] || detectFieldType(key, value);
            
            if (value === null || value === undefined) {
                sanitized[key] = value;
                continue;
            }

            // Manejar arrays
            if (Array.isArray(value)) {
                sanitized[key] = value.map((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        return sanitizeObject(item, fieldRules, results, `${context}.${key}[${index}]`);
                    }
                    return sanitizeValue(item, fieldRule, results, `${context}.${key}[${index}]`);
                });
                continue;
            }

            // Manejar objetos anidados
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value, fieldRules, results, `${context}.${key}`);
                continue;
            }

            // Sanitizar valor primitivo
            sanitized[key] = sanitizeValue(value, fieldRule, results, `${context}.${key}`);
        } catch (error) {
            results.errors.push({
                field: `${context}.${key}`,
                message: `Error sanitizando campo: ${error.message}`,
                severity: 'warning'
            });
            sanitized[key] = null;
        }
    }

    return sanitized;
}

/**
 * Sanitizar un valor individual
 */
function sanitizeValue(value, rule, results, fieldPath) {
    try {
        // Convertir a string si no lo es
        let stringValue = String(value).trim();

        // Aplicar sanitización
        let sanitized = rule.sanitize ? rule.sanitize(stringValue) : stringValue;

        // Validar resultado
        if (rule.validate && !rule.validate(sanitized)) {
            results.errors.push({
                field: fieldPath,
                message: `Valor no válido después de sanitización`,
                severity: 'warning',
                original: value,
                sanitized
            });
        }

        // Log si hubo cambios significativos
        if (stringValue !== String(sanitized)) {
            results.warnings.push({
                field: fieldPath,
                message: 'Valor modificado durante sanitización',
                original: value,
                sanitized
            });
        }

        return sanitized;
    } catch (error) {
        results.errors.push({
            field: fieldPath,
            message: `Error en sanitización: ${error.message}`,
            severity: 'critical'
        });
        return null;
    }
}

/**
 * Detectar tipo de campo automáticamente
 */
function detectFieldType(fieldName, value) {
    const name = fieldName.toLowerCase();
    
    // Detectar por nombre de campo
    if (name.includes('email') || name.includes('correo')) {
        return SANITIZATION_RULES.email;
    }
    if (name.includes('phone') || name.includes('telefono')) {
        return SANITIZATION_RULES.phone;
    }
    if (name.includes('name') || name.includes('nombre') || name.includes('firstname') || name.includes('lastname')) {
        return SANITIZATION_RULES.name;
    }
    if (name.includes('username') || name.includes('user')) {
        return SANITIZATION_RULES.username;
    }
    if (name.includes('password') || name.includes('contraseña')) {
        return SANITIZATION_RULES.password;
    }
    if (name.includes('country') || name.includes('pais')) {
        return SANITIZATION_RULES.country;
    }
    if (name.includes('city') || name.includes('ciudad')) {
        return SANITIZATION_RULES.city;
    }
    if (name.includes('url') || name.includes('link') || name.includes('website')) {
        return SANITIZATION_RULES.url;
    }

    // Detectar por tipo de valor
    if (typeof value === 'number') {
        return Number.isInteger(value) ? SANITIZATION_RULES.integer : SANITIZATION_RULES.number;
    }

    // Por defecto, tratar como texto
    return SANITIZATION_RULES.text;
}

/**
 * Función auxiliar para sanitizar texto
 */
function sanitizeText(text, options = {}) {
    const {
        allowHtml = false,
        allowAccents = false,
        maxLength = 255,
        allowNumbers = true,
        allowSpecialChars = false
    } = options;

    let sanitized = String(text).trim();

    // Remover HTML si no está permitido
    if (!allowHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Decodificar entidades HTML
    sanitized = sanitized
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'");

    // Remover caracteres de control
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Filtrar caracteres según opciones
    if (!allowAccents) {
        sanitized = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    if (!allowNumbers) {
        sanitized = sanitized.replace(/[0-9]/g, '');
    }

    if (!allowSpecialChars) {
        sanitized = sanitized.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '');
    }

    // Normalizar espacios
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Truncar si es muy largo
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength).trim();
    }

    return sanitized;
}

/**
 * Middleware para logging de sanitización
 */
export const logSanitization = (req, res, next) => {
    if (req.sanitizationResults) {
        const { errors, warnings } = req.sanitizationResults;
        
        if (errors.length > 0 || warnings.length > 0) {
            console.log('🧹 Data Sanitization Results:', {
                timestamp: new Date().toISOString(),
                endpoint: `${req.method} ${req.path}`,
                errors: errors.length,
                warnings: warnings.length,
                details: { errors, warnings }
            });
        }
    }
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
    password: SANITIZATION_RULES.password,
    username: SANITIZATION_RULES.username
};

/**
 * Reglas específicas para productos/artículos
 */
export const productRules = {
    descripcion_espanol: SANITIZATION_RULES.text,
    descripcion_chino: SANITIZATION_RULES.text,
    precio_unidad: SANITIZATION_RULES.number,
    precio_total: SANITIZATION_RULES.number,
    unidades_empaque: SANITIZATION_RULES.integer,
    marca_producto: SANITIZATION_RULES.text,
    material: SANITIZATION_RULES.text,
    medida_largo: SANITIZATION_RULES.number,
    medida_ancho: SANITIZATION_RULES.number,
    medida_alto: SANITIZATION_RULES.number
};

/**
 * Middleware para sanitización específica de uploads
 */
export const sanitizeFileData = (req, res, next) => {
    if (!req.files) {
        return next();
    }

    // Sanitizar metadatos de archivos
    Object.keys(req.files).forEach(fileKey => {
        const file = req.files[fileKey];
        
        // Sanitizar nombre de archivo
        if (file.name) {
            file.originalName = file.name;
            file.name = sanitizeText(file.name, {
                allowNumbers: true,
                allowSpecialChars: true,
                maxLength: 255
            }).replace(/[^a-zA-Z0-9._-]/g, '_');
        }

        // Validar MIME type
        if (file.mimetype) {
            file.mimetype = sanitizeText(file.mimetype, {
                allowSpecialChars: true,
                maxLength: 100
            });
        }
    });

    next();
};
