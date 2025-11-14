// utils/auth.utils.js
// Utilidades para operaciones de autenticación
import bcrypt from "bcrypt";

export class AuthUtils {
    
    /**
     * Normalizar email (convertir a minúsculas y trim)
     * @param {string} email - Email a normalizar
     * @returns {string} - Email normalizado
     */
    static normalizeEmail(email) {
        return email.toLowerCase().trim();
    }

    /**
     * Hash de contraseña
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<string>} - Contraseña hasheada
     */
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Comparar contraseña con hash
     * @param {string} password - Contraseña en texto plano
     * @param {string} hashedPassword - Contraseña hasheada
     * @returns {Promise<boolean>} - True si coinciden
     */
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Extraer IP del request
     * @param {Object} req - Request object
     * @returns {string} - Dirección IP
     */
    static extractClientIP(req) {
        return req.ip || 
               req.realIp || 
               req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               'unknown';
    }

    /**
     * Configurar cookie para token
     * @param {Object} res - Response object
     * @param {string} token - Token JWT
     */
    static setTokenCookie(res, token) {
        const isProduction = process.env.NODE_ENV === 'production';
        
        console.log('🍪 [AuthUtils] Configurando cookie de token:', {
            isProduction,
            token: token ? 'present' : 'missing'
        });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax', // Más permisivo en desarrollo
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            path: '/' // Asegurar que esté disponible en todas las rutas
        });
    }

    /**
     * Limpiar cookie de token
     * @param {Object} res - Response object
     */
    static clearTokenCookie(res) {
        res.clearCookie('token', { 
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }
}
