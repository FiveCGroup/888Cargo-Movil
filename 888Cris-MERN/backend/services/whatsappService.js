/**
 * WhatsApp Service - Servicio para enviar notificaciones por WhatsApp usando Twilio
 */

import twilio from 'twilio';

/**
 * Obtener cliente de Twilio
 */
const getTwilioClient = () => {
    try {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            throw new Error('Twilio credentials not configured');
        }
        return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (error) {
        console.error('❌ Error initializing Twilio:', error.message);
        return null;
    }
};

/**
 * Validar formato de teléfono y convertir a formato E.164 si es necesario
 * @param {string} phone - Número de teléfono
 * @returns {string} - Número en formato E.164 (+XXXXXXXXXXX)
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remover espacios, guiones, paréntesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si comienza con +, asumir que ya está en formato correcto
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    
    // Si comienza con 0, remover el 0 y agregar +56 (Chile por defecto)
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Si no comienza con +, agregar código de país
    if (!cleaned.startsWith('+')) {
        // Asegurar que es un número de celular válido (comienza con 9 para Chile)
        if (cleaned.startsWith('9')) {
            cleaned = '+56' + cleaned;
        } else {
            // Código por defecto para números cortos
            cleaned = '+56' + cleaned;
        }
    }
    
    return cleaned;
};

/**
 * Enviar mensaje de bienvenida por WhatsApp
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} name - Nombre del usuario
 * @returns {Promise}
 */
export const sendWelcomeWhatsApp = async (phone, name) => {
    try {
        if (process.env.ENABLE_WHATSAPP_NOTIFICATIONS !== 'true') {
            console.log('📱 WhatsApp notifications disabled');
            return { success: true, message: 'WhatsApp notifications disabled' };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, message: 'Twilio not configured' };
        }

        const formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone) {
            return { success: false, message: 'Invalid phone number' };
        }

        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${formattedPhone}`,
            body: `¡Hola ${name}! 👋\n\n¡Bienvenido a 888Cargo! 🚚\n\nTu cuenta ha sido creada exitosamente. Ya puedes acceder a nuestra plataforma para gestionar tus cargas.\n\n¿Necesitas ayuda? Responde este mensaje o visita nuestro sitio web.`
        });

        console.log('✅ Welcome WhatsApp message sent:', message.sid);
        return { success: true, message: 'Welcome WhatsApp message sent', messageSid: message.sid };

    } catch (error) {
        console.error('❌ Error sending welcome WhatsApp:', error.message);
        // No lanzar error para no interrumpir el flujo de registro
        return { success: false, message: error.message };
    }
};

/**
 * Enviar confirmación de registro por WhatsApp con código de confirmación
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} name - Nombre del usuario
 * @param {string} username - Username del usuario
 * @returns {Promise}
 */
export const sendRegistrationConfirmationWhatsApp = async (phone, name, username) => {
    try {
        if (process.env.ENABLE_WHATSAPP_NOTIFICATIONS !== 'true') {
            console.log('📱 WhatsApp notifications disabled');
            return { success: true, message: 'WhatsApp notifications disabled' };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, message: 'Twilio not configured' };
        }

        const formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone) {
            return { success: false, message: 'Invalid phone number' };
        }

        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${formattedPhone}`,
            body: `✅ Registro Confirmado - 888Cargo\n\nHola ${name},\n\nTu cuenta ha sido creada exitosamente.\n\nDatos de acceso:\n• Usuario: ${username}\n• Email: Revisa tu correo para más detalles\n\nYa puedes acceder a la plataforma. ¡Que disfrutes! 🎉`
        });

        console.log('✅ Registration confirmation WhatsApp sent:', message.sid);
        return { success: true, message: 'Registration confirmation WhatsApp sent', messageSid: message.sid };

    } catch (error) {
        console.error('❌ Error sending registration confirmation WhatsApp:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Enviar notificación genérica por WhatsApp
 * @param {string} phone - Número de teléfono
 * @param {string} message - Mensaje a enviar
 * @returns {Promise}
 */
export const sendWhatsAppMessage = async (phone, message) => {
    try {
        if (process.env.ENABLE_WHATSAPP_NOTIFICATIONS !== 'true') {
            console.log('📱 WhatsApp notifications disabled');
            return { success: true, message: 'WhatsApp notifications disabled' };
        }

        const client = getTwilioClient();
        if (!client) {
            return { success: false, message: 'Twilio not configured' };
        }

        const formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone) {
            return { success: false, message: 'Invalid phone number' };
        }

        const result = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${formattedPhone}`,
            body: message
        });

        console.log('✅ WhatsApp message sent:', result.sid);
        return { success: true, message: 'WhatsApp message sent', messageSid: result.sid };

    } catch (error) {
        console.error('❌ Error sending WhatsApp message:', error.message);
        return { success: false, message: error.message };
    }
};

export default {
    sendWelcomeWhatsApp,
    sendRegistrationConfirmationWhatsApp,
    sendWhatsAppMessage,
    formatPhoneNumber
};
