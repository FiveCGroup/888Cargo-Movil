import jwt from 'jsonwebtoken';
import { get } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mobile_secret_888cargo_2024';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar usuario
        const user = await get('SELECT * FROM users WHERE id = ?', [decoded.id]);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        // Agregar usuario al request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.nombre_cliente || user.username
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        console.error('❌ [Auth Middleware] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error de autenticación',
            error: error.message
        });
    }
};
