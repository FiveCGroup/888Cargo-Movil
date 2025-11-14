// middlewares/dataSanitization.middleware.simple.js
// Versión simplificada del middleware de sanitización para diagnóstico

import validator from 'validator';

/**
 * Middleware simplificado de sanitización para diagnóstico
 */
export const sanitizeRequest = (fieldRules = {}) => {
    return (req, res, next) => {
        try {
            console.log('🧹 Sanitizing request data:', {
                body: req.body,
                method: req.method,
                path: req.path
            });

            // Sanitización básica solo para campos críticos
            if (req.body) {
                if (req.body.email) {
                    req.body.email = req.body.email.toLowerCase().trim();
                }
                
                if (req.body.name) {
                    req.body.name = req.body.name.trim();
                }
                
                if (req.body.lastname) {
                    req.body.lastname = req.body.lastname.trim();
                }
                
                if (req.body.phone) {
                    req.body.phone = req.body.phone.trim();
                }
                
                if (req.body.country) {
                    req.body.country = req.body.country.trim();
                }
                
                // NO modificar password más allá de trim básico
                if (req.body.password) {
                    req.body.password = req.body.password.trim();
                }
            }

            console.log('✅ Sanitization completed:', req.body);
            next();
        } catch (error) {
            console.error('❌ Error en sanitización:', error);
            next(); // Continuar sin sanitización en caso de error
        }
    };
};

/**
 * Middleware para logging simplificado
 */
export const logSanitization = (req, res, next) => {
    console.log('📝 Request log:', {
        method: req.method,
        path: req.path,
        body: req.body,
        timestamp: new Date().toISOString()
    });
    next();
};

/**
 * Reglas básicas para registro de usuario (simplificadas)
 */
export const userRegistrationRules = {
    // Solo definir para compatibilidad, no usar validación estricta
    email: true,
    password: true,
    name: true,
    lastname: true,
    phone: true,
    country: true
};

export default { sanitizeRequest, logSanitization, userRegistrationRules };
