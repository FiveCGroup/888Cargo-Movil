// services/recuperacion.service.js
// Servicio para lógica de negocio de recuperación de contraseñas
import crypto from 'crypto';
import { get, run } from '../db.js';
import { AuthUtils } from '../utils/auth.utils.js';
import { RecuperacionValidator } from "../validators/recuperacion.validator.js";
import { WhatsAppService } from "./whatsapp.service.js";

export class RecuperacionService {
    
    // Los tokens ahora se almacenan en la base de datos para persistencia

    /**
     * Enviar enlace de recuperación por WhatsApp
     * @param {string} telefono - Número de teléfono
     * @returns {Promise<Object>} - Resultado del envío
     */
    static async enviarEnlaceRecuperacion(telefono) {
        // Validar y normalizar formato de teléfono (el usuario debe incluir código de país)
        const telefonoNormalizado = RecuperacionValidator.validatePhoneNumber(telefono);
        
        // Buscar usuario en la tabla 'users' (no en 'cliente')
        // Intentamos buscar con y sin el símbolo + ya que la BD puede tener ambos formatos
        let user = await get(
            'SELECT * FROM users WHERE telefono_cliente = ? OR telefono_cliente = ?', 
            [telefonoNormalizado, `+${telefonoNormalizado}`]
        );

        if (!user) {
            throw new Error('No existe una cuenta con ese número de teléfono. Verifica que incluyas el código de país (ej: 573001234567)');
        }

        // Generar token de recuperación
        const tokenRecuperacion = this.generateRecoveryToken();
        const expirationTime = this.getTokenExpirationTime();

        // Limpiar tokens expirados del usuario (opcional, para mantener la BD limpia)
        await this.cleanExpiredTokens(user.id);

        // Almacenar token en base de datos
        await run(
            'INSERT INTO recovery_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
            [tokenRecuperacion, user.id, expirationTime.toISOString()]
        );

        // Construir enlace y enviar mensaje
        const enlace = this.buildRecoveryLink(tokenRecuperacion);
        
        // Enviar mensaje por WhatsApp usando template
        // WhatsApp API requiere el número con el símbolo +
        const telefonoWhatsApp = `+${telefonoNormalizado}`;
        
        // Template aprobado para recuperación de contraseña
        const templateName = process.env.WHATSAPP_RECOVERY_TEMPLATE || 'cambiar_contrasena_888';
        
        try {
            // Usar template con código de idioma específico para Colombia
            await WhatsAppService.sendTemplateMessage(
                telefonoWhatsApp, 
                templateName,
                [user.nombre_cliente, enlace], // Parámetros del template
                'es_CO' // Código específico para español de Colombia
            );
        } catch (templateError) {
            console.warn('⚠️ Error al enviar template, usando mensaje de texto:', templateError.message);
            // Fallback: mensaje de texto si falla el template
            const mensaje = this.buildRecoveryMessage(user.nombre_cliente, enlace);
            await WhatsAppService.sendTextMessage(telefonoWhatsApp, mensaje);
        }

        return {
            success: true,
            message: 'Hemos enviado un enlace de recuperación a tu WhatsApp.'
        };
    }

    /**
     * Verificar validez de token
     * @param {string} token - Token a verificar
     * @returns {Promise<Object>} - Estado del token
     */
    static async verificarToken(token) {
        // Buscar token en base de datos
        const tokenData = await get(
            'SELECT * FROM recovery_tokens WHERE token = ? AND used_at IS NULL',
            [token]
        );

        if (!tokenData) {
            throw new Error('Token inválido o ya ha sido utilizado.');
        }

        // Verificar si el token ha expirado
        const expirationTime = new Date(tokenData.expires_at);
        if (new Date() > expirationTime) {
            // Marcar token como expirado (eliminarlo)
            await run('DELETE FROM recovery_tokens WHERE token = ?', [token]);
            throw new Error('El token ha expirado.');
        }

        return { 
            valid: true,
            userId: tokenData.user_id,
            expiresAt: expirationTime
        };
    }

    /**
     * Cambiar contraseña usando token
     * @param {string} token - Token de recuperación
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<Object>} - Resultado del cambio
     */
    static async cambiarPassword(token, newPassword) {
        // Validar nueva contraseña
        RecuperacionValidator.validatePassword(newPassword);
        
        // Verificar token (esto también valida expiración)
        const tokenVerification = await this.verificarToken(token);
        const userId = tokenVerification.userId;

        // Hashear nueva contraseña
        const hashedPassword = await AuthUtils.hashPassword(newPassword);

        // Actualizar contraseña en BD
        await run(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        );

        // Marcar token como usado
        await run(
            'UPDATE recovery_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?',
            [token]
        );

        // Invalidar todos los demás tokens del usuario por seguridad
        await run(
            'UPDATE recovery_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND token != ? AND used_at IS NULL',
            [userId, token]
        );

        return {
            success: true,
            message: 'Contraseña actualizada correctamente.'
        };
    }

    /**
     * Generar token de recuperación
     * @returns {string} - Token único
     */
    static generateRecoveryToken() {
        return crypto.randomBytes(20).toString('hex');
    }

    /**
     * Obtener tiempo de expiración del token
     * @returns {Date} - Fecha de expiración
     */
    static getTokenExpirationTime() {
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 30); // 30 minutos
        return expirationTime;
    }

    /**
     * Construir enlace de recuperación
     * @param {string} token - Token de recuperación
     * @returns {string} - URL completa
     */
    static buildRecoveryLink(token) {
        // Para app móvil, usar el esquema de deep linking de Expo
        // El formato es: exp://IP:PORT/--/reset-password?token=XXX
        // O para producción: myapp://reset-password?token=XXX
        const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:8081';
        return `${baseUrl}/reset-password?token=${token}`;
    }

    /**
     * Construir mensaje de recuperación
     * @param {string} nombreCliente - Nombre del cliente
     * @param {string} enlace - Enlace de recuperación
     * @returns {string} - Mensaje formateado
     */
    static buildRecoveryMessage(nombreCliente, enlace) {
        return `🚛 *888Cargo - Recuperación de Contraseña*\n\nHola ${nombreCliente},\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\n🔗 *Haz clic en este enlace:*\n${enlace}\n\n⏱️ *Importante:* Este enlace expirará en 30 minutos por seguridad.\n\n🔒 Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.\n\n*Equipo 888Cargo*`;
    }

    /**
     * Limpiar tokens expirados de un usuario
     * @param {number} userId - ID del usuario
     * @returns {Promise<void>}
     */
    static async cleanExpiredTokens(userId) {
        try {
            const result = await run(
                'DELETE FROM recovery_tokens WHERE user_id = ? AND (expires_at < CURRENT_TIMESTAMP OR used_at IS NOT NULL)',
                [userId]
            );
            
            if (result.changes > 0) {
                console.log(`🧹 Limpiados ${result.changes} tokens expirados/usados del usuario ${userId}`);
            }
        } catch (error) {
            console.warn('⚠️ Error al limpiar tokens expirados:', error.message);
        }
    }

    /**
     * Limpiar todos los tokens expirados del sistema
     * @returns {Promise<void>}
     */
    static async cleanAllExpiredTokens() {
        try {
            const result = await run(
                'DELETE FROM recovery_tokens WHERE expires_at < CURRENT_TIMESTAMP OR used_at IS NOT NULL'
            );
            
            if (result.changes > 0) {
                console.log(`🧹 Limpiados ${result.changes} tokens expirados/usados del sistema`);
            }
            
            return result.changes;
        } catch (error) {
            console.error('❌ Error al limpiar tokens expirados del sistema:', error.message);
            return 0;
        }
    }

    /**
     * Obtener estadísticas de tokens de recuperación
     * @returns {Promise<Object>} - Estadísticas
     */
    static async getTokenStats() {
        try {
            const active = await get('SELECT COUNT(*) as count FROM recovery_tokens WHERE expires_at > CURRENT_TIMESTAMP AND used_at IS NULL');
            const expired = await get('SELECT COUNT(*) as count FROM recovery_tokens WHERE expires_at <= CURRENT_TIMESTAMP AND used_at IS NULL');
            const used = await get('SELECT COUNT(*) as count FROM recovery_tokens WHERE used_at IS NOT NULL');
            
            return {
                active: active.count,
                expired: expired.count,
                used: used.count,
                total: active.count + expired.count + used.count
            };
        } catch (error) {
            console.error('❌ Error al obtener estadísticas de tokens:', error.message);
            return { active: 0, expired: 0, used: 0, total: 0 };
        }
    }
}
