// validators/recuperacion.validator.js
// Validador para operaciones de recuperación de contraseñas
import { z } from "zod";
import { BaseValidator } from "./base.validator.js";

export class RecuperacionValidator extends BaseValidator {
    
    // Schema para solicitud de recuperación
    static solicitudRecuperacionSchema = z.object({
        telefono: z.string()
            .regex(/^\+?[0-9]{10,15}$/, "Número inválido (ej: +573001112233)")
            .transform(val => val.replace(/\s+/g, ''))
    });

    // Schema para verificación de token
    static verificacionTokenSchema = z.object({
        token: z.string()
            .min(10, "Token inválido")
            .max(255, "Token demasiado largo")
    });

    // Schema para cambio de contraseña
    static cambioPasswordSchema = z.object({
        token: z.string()
            .min(10, "Token inválido")
            .max(255, "Token demasiado largo"),
        
        newPassword: z.string()
            .min(6, "Nueva contraseña debe tener al menos 6 caracteres")
            .max(100, "Nueva contraseña no puede exceder 100 caracteres")
            .regex(/[A-Za-z]/, "Nueva contraseña debe contener al menos una letra")
            .regex(/[0-9]/, "Nueva contraseña debe contener al menos un número"),
        
        confirmPassword: z.string()
            .min(1, "Confirmación de contraseña es requerida")
    }).refine(data => data.newPassword === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"]
    });

    // Schema para validación de código WhatsApp
    static codigoWhatsAppSchema = z.object({
        telefono: z.string()
            .regex(/^\+?[0-9]{10,15}$/, "Número inválido"),
        
        codigo: z.string()
            .length(6, "Código debe tener exactamente 6 dígitos")
            .regex(/^\d{6}$/, "Código debe contener solo números")
    });

    /**
     * Validar solicitud de recuperación de contraseña
     * @param {Object} data - Datos de la solicitud
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateSolicitudRecuperacion(data) {
        try {
            const validatedData = this.solicitudRecuperacionSchema.parse(data);
            
            // Normalizar número de teléfono
            validatedData.telefono = this.normalizePhone(validatedData.telefono);
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar token de recuperación
     * @param {Object} data - Datos del token
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateToken(data) {
        try {
            return this.verificacionTokenSchema.parse(data);
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar cambio de contraseña
     * @param {Object} data - Datos del cambio
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateCambioPassword(data) {
        try {
            const validatedData = this.cambioPasswordSchema.parse(data);
            
            // Eliminar confirmPassword del resultado (no se almacena)
            delete validatedData.confirmPassword;
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar código de WhatsApp
     * @param {Object} data - Datos del código
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateCodigoWhatsApp(data) {
        try {
            const validatedData = this.codigoWhatsAppSchema.parse(data);
            
            // Normalizar número de teléfono
            validatedData.telefono = this.normalizePhone(validatedData.telefono);
            
            return validatedData;
        } catch (error) {
            throw new Error(this.formatZodError(error));
        }
    }

    /**
     * Validar formato de número de teléfono (método específico)
     * @param {string} telefono - Número de teléfono con código de país (sin +)
     * @returns {string} - Teléfono validado y normalizado (sin +)
     * @throws {Error} - Error de validación
     */
    static validatePhoneNumber(telefono) {
        if (!telefono || typeof telefono !== 'string') {
            throw new Error('Número de teléfono es requerido');
        }

        // Eliminar espacios y el símbolo + si existe
        let normalizedPhone = telefono.replace(/\s+/g, '').replace(/^\+/, '');
        
        // Validar que contenga entre 10 y 15 dígitos
        if (!normalizedPhone.match(/^[0-9]{10,15}$/)) {
            throw new Error("Número inválido. Debe incluir código de país (ej: 573001234567 para Colombia, 8613800000000 para China)");
        }

        return normalizedPhone;
    }

    /**
     * Validar que el token no haya expirado
     * @param {Date} fechaExpiracion - Fecha de expiración del token
     * @throws {Error} - Error si el token ha expirado
     */
    static validateTokenExpiration(fechaExpiracion) {
        if (!fechaExpiracion || !(fechaExpiracion instanceof Date)) {
            throw new Error("Fecha de expiración inválida");
        }

        if (fechaExpiracion < new Date()) {
            throw new Error("El token de recuperación ha expirado. Solicite un nuevo enlace");
        }
    }

    /**
     * Validar intentos de recuperación
     * @param {number} intentos - Número de intentos
     * @param {number} maxIntentos - Máximo número de intentos permitidos
     * @throws {Error} - Error si se superan los intentos
     */
    static validateRecoveryAttempts(intentos, maxIntentos = 3) {
        if (intentos >= maxIntentos) {
            throw new Error(`Se ha superado el límite de ${maxIntentos} intentos. Intente nuevamente en 1 hora`);
        }
    }

    /**
     * Validar tiempo entre solicitudes
     * @param {Date} ultimaSolicitud - Fecha de la última solicitud
     * @param {number} minutos - Minutos mínimos entre solicitudes
     * @throws {Error} - Error si no ha pasado suficiente tiempo
     */
    static validateRequestCooldown(ultimaSolicitud, minutos = 5) {
        if (!ultimaSolicitud) return;

        const tiempoEspera = minutos * 60 * 1000; // Convertir a milisegundos
        const tiempoTranscurrido = Date.now() - ultimaSolicitud.getTime();
        
        if (tiempoTranscurrido < tiempoEspera) {
            const minutosRestantes = Math.ceil((tiempoEspera - tiempoTranscurrido) / 60000);
            throw new Error(`Debe esperar ${minutosRestantes} minutos antes de solicitar otro enlace`);
        }
    }

    /**
     * Validar datos de configuración WhatsApp
     * @param {Object} config - Configuración de WhatsApp
     * @returns {Object} - Configuración validada
     * @throws {Error} - Error de validación
     */
    static validateWhatsAppConfig(config) {
        const { instanceId, token, fromNumber } = config;
        
        if (!instanceId || typeof instanceId !== 'string') {
            throw new Error("Instance ID de WhatsApp es requerido");
        }
        
        if (!token || typeof token !== 'string') {
            throw new Error("Token de WhatsApp es requerido");
        }
        
        if (!fromNumber || typeof fromNumber !== 'string') {
            throw new Error("Número origen de WhatsApp es requerido");
        }
        
        // Validar formato del número origen
        this.validatePhoneNumber(fromNumber);
        
        return {
            instanceId: instanceId.trim(),
            token: token.trim(),
            fromNumber: this.normalizePhone(fromNumber)
        };
    }

    /**
     * Validar mensaje de WhatsApp
     * @param {Object} messageData - Datos del mensaje
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateWhatsAppMessage(messageData) {
        const { telefono, mensaje, tipo = 'text' } = messageData;
        
        if (!telefono) {
            throw new Error("Número de teléfono destinatario es requerido");
        }
        
        if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
            throw new Error("Mensaje es requerido");
        }
        
        if (mensaje.length > 4000) {
            throw new Error("Mensaje no puede exceder 4000 caracteres");
        }
        
        const tiposPermitidos = ['text', 'template'];
        if (!tiposPermitidos.includes(tipo)) {
            throw new Error(`Tipo de mensaje inválido. Permitidos: ${tiposPermitidos.join(', ')}`);
        }
        
        return {
            telefono: this.validatePhoneNumber(telefono),
            mensaje: this.sanitizeInput(mensaje.trim()),
            tipo
        };
    }

    /**
     * Validar datos de auditoría de recuperación
     * @param {Object} auditData - Datos de auditoría
     * @returns {Object} - Datos validados
     * @throws {Error} - Error de validación
     */
    static validateAuditData(auditData) {
        const { 
            userId, 
            accion, 
            ip, 
            userAgent, 
            resultado = 'pendiente',
            detalles 
        } = auditData;
        
        if (userId !== undefined) {
            this.validateUserId(userId);
        }
        
        if (!accion || typeof accion !== 'string') {
            throw new Error("Acción de auditoría es requerida");
        }
        
        const accionesPermitidas = [
            'solicitud_recuperacion',
            'verificacion_token',
            'cambio_password',
            'envio_whatsapp',
            'verificacion_codigo'
        ];
        
        if (!accionesPermitidas.includes(accion)) {
            throw new Error(`Acción inválida. Permitidas: ${accionesPermitidas.join(', ')}`);
        }
        
        const resultadosPermitidos = ['exito', 'error', 'pendiente'];
        if (!resultadosPermitidos.includes(resultado)) {
            throw new Error(`Resultado inválido. Permitidos: ${resultadosPermitidos.join(', ')}`);
        }
        
        return {
            userId,
            accion,
            ip: ip ? this.sanitizeInput(ip) : null,
            userAgent: userAgent ? this.sanitizeInput(userAgent) : null,
            resultado,
            detalles: detalles ? this.sanitizeInput(detalles) : null,
            fechaHora: new Date()
        };
    }

    /**
     * Validar parámetros de consulta de auditoría
     * @param {Object} queryParams - Parámetros de consulta
     * @returns {Object} - Parámetros validados
     * @throws {Error} - Error de validación
     */
    static validateAuditQuery(queryParams) {
        const {
            userId,
            accion,
            resultado,
            fechaInicio,
            fechaFin,
            page = 1,
            limit = 10
        } = queryParams;
        
        const validated = {};
        
        if (userId !== undefined) {
            validated.userId = this.validateUserId(userId);
        }
        
        if (accion !== undefined) {
            const accionesPermitidas = [
                'solicitud_recuperacion',
                'verificacion_token', 
                'cambio_password',
                'envio_whatsapp',
                'verificacion_codigo'
            ];
            validated.accion = this.validateEnum(accion, accionesPermitidas, "Acción");
        }
        
        if (resultado !== undefined) {
            const resultadosPermitidos = ['exito', 'error', 'pendiente'];
            validated.resultado = this.validateEnum(resultado, resultadosPermitidos, "Resultado");
        }
        
        if (fechaInicio) {
            validated.fechaInicio = this.validateDate(fechaInicio, "Fecha de inicio");
        }
        
        if (fechaFin) {
            validated.fechaFin = this.validateDate(fechaFin, "Fecha de fin");
            
            // Validar que fecha fin sea mayor que fecha inicio
            if (validated.fechaInicio && validated.fechaFin < validated.fechaInicio) {
                throw new Error("Fecha de fin debe ser mayor que fecha de inicio");
            }
        }
        
        validated.page = this.validateId(page, "Página");
        validated.limit = this.validateId(limit, "Límite");
        
        if (validated.limit > 100) {
            throw new Error("Límite no puede exceder 100 registros");
        }
        
        return validated;
    }
}
