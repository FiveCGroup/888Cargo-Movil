/**
 * Ejemplos de Uso - Servicios de Notificaciones
 * Este archivo muestra cómo usar los servicios de email y WhatsApp en otros partes del código
 */

// ============================================================
// IMPORTAR SERVICIOS
// ============================================================

import emailService from "../services/emailService.js";
import whatsappService from "../services/whatsappService.js";

// ============================================================
// EJEMPLOS CON EMAIL SERVICE
// ============================================================

/**
 * Ejemplo 1: Enviar email de bienvenida cuando usuario se registra
 */
export const example_sendWelcomeEmail = async () => {
    const result = await emailService.sendWelcomeEmail(
        'usuario@example.com',
        'Juan'
    );
    
    if (result.success) {
        console.log('✅ Email enviado:', result.message);
    } else {
        console.error('❌ Error:', result.message);
    }
};

/**
 * Ejemplo 2: Enviar confirmación de registro
 */
export const example_sendConfirmationEmail = async () => {
    const result = await emailService.sendRegistrationConfirmation(
        'usuario@example.com',
        'Juan Pérez',
        'juan_perez'
    );
    
    if (result.success) {
        console.log('✅ Confirmación enviada');
    } else {
        console.error('❌ Error:', result.message);
    }
};

// ============================================================
// EJEMPLOS CON WHATSAPP SERVICE
// ============================================================

/**
 * Ejemplo 3: Enviar WhatsApp de bienvenida
 */
export const example_sendWelcomeWhatsApp = async () => {
    const result = await whatsappService.sendWelcomeWhatsApp(
        '+56912345678',  // Número de teléfono
        'Juan'           // Nombre
    );
    
    if (result.success) {
        console.log('✅ WhatsApp enviado:', result.messageSid);
    } else {
        console.error('❌ Error:', result.message);
    }
};

/**
 * Ejemplo 4: Enviar confirmación por WhatsApp
 */
export const example_sendConfirmationWhatsApp = async () => {
    const result = await whatsappService.sendRegistrationConfirmationWhatsApp(
        '+56912345678',  // Número de teléfono
        'Juan Pérez',    // Nombre
        'juan_perez'     // Username
    );
    
    if (result.success) {
        console.log('✅ Confirmación WhatsApp enviada');
    } else {
        console.error('❌ Error:', result.message);
    }
};

/**
 * Ejemplo 5: Enviar mensaje personalizado por WhatsApp
 */
export const example_sendCustomWhatsApp = async () => {
    const result = await whatsappService.sendWhatsAppMessage(
        '+56912345678',
        '¡Hola! Tu carga está lista para retirar. Código: ABC123'
    );
    
    if (result.success) {
        console.log('✅ Mensaje enviado:', result.messageSid);
    } else {
        console.error('❌ Error:', result.message);
    }
};

// ============================================================
// EJEMPLO: ENVÍO COMBINADO (Email + WhatsApp)
// ============================================================

/**
 * Ejemplo 6: Notificación de nueva carga (Email + WhatsApp)
 */
export const example_notifyNewLoad = async (user) => {
    const { email, nombre_cliente, telefono_cliente } = user;
    
    // Enviar email (sin esperar)
    emailService.sendWhatsAppMessage(
        email,
        `Nueva carga registrada: ${user.carga_id}`
    ).catch(err => console.error('Error email:', err));
    
    // Enviar WhatsApp (sin esperar)
    if (telefono_cliente) {
        whatsappService.sendWhatsAppMessage(
            telefono_cliente,
            `📦 Se registró una nueva carga.\nCódigo: ${user.carga_id}\nEstado: Pendiente`
        ).catch(err => console.error('Error WhatsApp:', err));
    }
};

// ============================================================
// EJEMPLO: EN UN CONTROLADOR
// ============================================================

/**
 * Ejemplo 7: Uso en un controlador - Notificar cambio de estado de carga
 */
export const updateCargoStatus = async (req, res) => {
    try {
        const { cargoId, newStatus } = req.body;
        const user = req.user;  // Obtenido de middleware de autenticación
        
        // Actualizar estado en base de datos
        // ... código de actualización ...
        
        // Enviar notificaciones
        const notificationMessage = `Tu carga ${cargoId} cambió a estado: ${newStatus}`;
        
        // Email
        if (process.env.EMAIL_NOTIFICATIONS === 'true') {
            emailService.sendWhatsAppMessage(
                user.email,
                notificationMessage
            ).catch(err => {
                console.error('Email error:', err.message);
                // Continuar aunque falle email
            });
        }
        
        // WhatsApp
        if (process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true' && user.telefono_cliente) {
            whatsappService.sendWhatsAppMessage(
                user.telefono_cliente,
                `📦 ${notificationMessage}`
            ).catch(err => {
                console.error('WhatsApp error:', err.message);
                // Continuar aunque falle WhatsApp
            });
        }
        
        res.json({ success: true, message: 'Carga actualizada y notificaciones enviadas' });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// EJEMPLO: CON MANEJO DE ERRORES ROBUSTO
// ============================================================

/**
 * Ejemplo 8: Función wrapper para enviar notificaciones con reintentos
 */
export const sendNotificationWithRetry = async (email, phone, message, maxRetries = 3) => {
    let emailSent = false;
    let whatsappSent = false;
    
    // Intentar enviar email
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await emailService.sendWhatsAppMessage(email, message);
            if (result.success) {
                emailSent = true;
                break;
            }
        } catch (error) {
            console.warn(`Email attempt ${i + 1}/${maxRetries} failed:`, error.message);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s antes de reintentar
            }
        }
    }
    
    // Intentar enviar WhatsApp
    if (phone) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await whatsappService.sendWhatsAppMessage(phone, message);
                if (result.success) {
                    whatsappSent = true;
                    break;
                }
            } catch (error) {
                console.warn(`WhatsApp attempt ${i + 1}/${maxRetries} failed:`, error.message);
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    }
    
    return {
        emailSent,
        whatsappSent,
        success: emailSent || whatsappSent
    };
};

// ============================================================
// EJEMPLO: USO EN OTROS CONTROLADORES
// ============================================================

/**
 * Ejemplo 9: Notificar al contactar soporte
 */
export const notifySupport = async (req, res) => {
    try {
        const { email, phone, name, message } = req.body;
        
        // Guardar ticket de soporte
        // ... código ...
        
        // Enviar confirmación al usuario
        const confirmationMessage = `Hola ${name}, hemos recibido tu mensaje. Te contactaremos pronto.`;
        
        const results = await sendNotificationWithRetry(
            email,
            phone,
            confirmationMessage,
            2  // 2 reintentos máximo
        );
        
        res.json({
            success: true,
            notifications: results,
            message: 'Ticket creado, confirmación enviada'
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// NOTAS IMPORTANTES
// ============================================================

/*
1. ENVÍO ASINCRÓNICO:
   - Usar .catch() para manejar errores sin bloquear
   - No usar await en rutas HTTP (a menos que sea crítico)
   
2. CONFIGURACIÓN:
   - EMAIL_NOTIFICATIONS debe estar en true en .env
   - ENABLE_WHATSAPP_NOTIFICATIONS debe estar en true en .env
   - Si están en false, las funciones retornan {success: true} sin enviar
   
3. FORMATOS DE TELÉFONO:
   - Acepta: "+56912345678", "912345678", "+1-415-xxx-yyyy"
   - Convierte automáticamente a formato E.164
   
4. ERRORES:
   - Los servicios NO lanzan excepciones
   - Siempre retornan {success: boolean, message: string}
   - Para debug, revisar console.logs con prefijos ✅ / ❌
   
5. PRIVACIDAD:
   - NO guardar contraseñas en logs
   - Los tokens y credenciales están en variables de entorno
   - Usar HTTPS en producción
*/
