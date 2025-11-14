// controllers/recuperacion.controller.js
// Controlador para operaciones de recuperación de contraseñas
import { RecuperacionService } from "../services/recuperacion.service.js";

/**
 * Enviar enlace de recuperación por WhatsApp
 */
export const enviarEnlace = async (req, res) => {
    try {
        const { telefono } = req.body;
        
        const result = await RecuperacionService.enviarEnlaceRecuperacion(telefono);
        
        res.json(result);
        
    } catch (error) {
        console.error('Error al enviar enlace de recuperación:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar la solicitud de recuperación.'
        });
    }
};

/**
 * Verificar validez de token de recuperación
 */
export const verificarToken = async (req, res) => {
    try {
        const { token } = req.params;
        
        const result = await RecuperacionService.verificarToken(token);
        
        res.json(result);
        
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(400).json({
            valid: false,
            message: error.message || 'Token inválido.'
        });
    }
};

/**
 * Cambiar contraseña usando token de recuperación
 */
export const cambiarPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        const result = await RecuperacionService.cambiarPassword(token, newPassword);
        
        res.json(result);
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al actualizar la contraseña.'
        });
    }
};
