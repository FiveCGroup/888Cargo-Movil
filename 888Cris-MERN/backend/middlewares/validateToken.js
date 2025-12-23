import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const authRequired = (req, res, next) => {
    console.log('🔐 [AuthMiddleware] Validando autenticación para:', req.method, req.originalUrl);
    console.log('🔐 [AuthMiddleware] Cookies recibidas:', req.cookies);
    console.log('🔐 [AuthMiddleware] Headers relevantes:', {
        authorization: req.headers.authorization,
        cookie: req.headers.cookie,
        'user-agent': req.headers['user-agent'],
        'x-requested-with': req.headers['x-requested-with']
    });
    
    // Identificar si es una solicitud móvil
    const isMobileRequest = req.headers['user-agent']?.includes('Expo-Mobile-App') || 
                           req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    console.log('📱 [AuthMiddleware] Es solicitud móvil:', isMobileRequest);
    
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
        
    if (!token || token === 'undefined') {
        console.log('❌ [AuthMiddleware] No hay token válido en cookies ni Authorization header');
        return res.status(401).json({ message: 'No hay token, acceso denegado' });
    }
    
    try {
        const decoded = jwt.verify(token, TOKEN_SECRET);
        req.user = decoded;
        req.userId = decoded.id; // Para compatibilidad
        req.isMobileRequest = isMobileRequest;
        console.log('✅ [AuthMiddleware] Token válido para usuario:', decoded.id, isMobileRequest ? '(MÓVIL)' : '(WEB)');
        next();
    } catch (error) {
        console.log('❌ [AuthMiddleware] Token inválido:', error.message);
        return res.status(403).json({ message: 'Token inválido' });
    }
};
