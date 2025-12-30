/**
 * WhatsApp Service - Servicio para enviar notificaciones por WhatsApp usando WhatsApp Business API (Meta)
 */

import axios from 'axios';

/**
 * Obtener configuración de WhatsApp
 */
const getWhatsAppConfig = () => {
    const enabled = process.env.WHATSAPP_ENABLED === 'true';
    console.log('🔍 WHATSAPP_ENABLED value:', JSON.stringify(process.env.WHATSAPP_ENABLED));
    console.log('🔍 WHATSAPP_ENABLED === "true":', enabled);

    const token = process.env.WHATSAPP_TOKEN;
    const baseUrl = process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com/v18.0';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!enabled) {
        console.log('📱 WhatsApp notifications disabled');
        return null;
    }

    if (!token || !phoneNumberId) {
        console.error('❌ WhatsApp credentials not configured (token or phone_number_id missing)');
        return null;
    }

    return { token, baseUrl, phoneNumberId };
};

/**
 * Validar formato de teléfono y convertir a formato E.164 si es necesario
 * @param {string} phone - Número de teléfono (puede incluir código de país o no)
 * @returns {string} - Número en formato E.164 (+XXXXXXXXXXX)
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remover espacios, guiones, paréntesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si ya comienza con +, asumir que está en formato correcto (E.164)
    if (cleaned.startsWith('+')) {
        // Validar longitud básica (mínimo 7 dígitos total para números válidos)
        if (cleaned.length < 7) {
            console.warn('Número de teléfono demasiado corto:', cleaned);
            return null;
        }
        return cleaned;
    }

    // Soportar prefijo internacional con 00 (ej. 005995...) => +5995...
    if (cleaned.startsWith('00')) {
        const asPlus = '+' + cleaned.substring(2);
        if (asPlus.length >= 7) return asPlus;
    }
    
    // Si no tiene +, intentar agregar código de país basado en prefijo
    // Estados Unidos/Canadá (+1) - si comienza con 1 y tiene 10 dígitos
    if (cleaned.startsWith('1') && cleaned.length === 11) {
        return '+1' + cleaned.substring(1);
    }
    
    // Colombia (+57) - si comienza con 3 y tiene 10 dígitos
    if (cleaned.startsWith('3') && cleaned.length === 10) {
        return '+57' + cleaned;
    }
    
    // Para otros países, requerir que el usuario ingrese el + manualmente
    console.warn('Número sin código de país (+). Ingrese el número completo con código internacional (ej. +1XXXXXXXXXX) o use prefijo 00:', cleaned);
    return null; // O lanza error para forzar corrección
};

/**
 * Enviar mensaje de bienvenida por WhatsApp
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} name - Nombre del usuario
 * @returns {Promise}
 */
export const sendWelcomeWhatsApp = async (phone, name, countryParam = '') => {
    try {
        const config = getWhatsAppConfig();
        if (!config) {
            return { success: false, message: 'WhatsApp not configured' };
        }

        const formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone) {
            return { success: false, message: 'Invalid phone number' };
        }

        // Seleccionar plantilla e idioma según país proporcionado en el registro (countryParam).
        const decideTemplate = (country, phoneNumber) => {
            const c = (country || '').toString().toLowerCase().trim();
            const spanish = ['colombia','argentina','mexico','españa','chile','perú','peru','ecuador','bolivia','paraguay','uruguay','venezuela','cuba','república dominicana','dominican republic','panamá','panama','guatemala','honduras','el salvador','nicaragua','costa rica','costarica'];
            const english = ['united states','united states of america','usa','canada','united kingdom','uk','australia','new zealand','ireland','singapore'];
            const chinese = ['china','chn','people\'s republic of china','prc'];

            if (c) {
                if (spanish.some(s => c.includes(s))) return { template: 'registro_exitoso_888cargo', lang: 'es_CO' };
                if (english.some(s => c.includes(s))) return { template: 'bienvenida_registro', lang: 'en_US' };
                if (chinese.some(s => c.includes(s))) return { template: 'registro_bienvenida_chino', lang: 'zh_CN' };
            }

            // Fallback a detección por prefijo telefónico
            if (phoneNumber && phoneNumber.startsWith('+86')) return { template: 'registro_bienvenida_chino', lang: 'zh_CN' };
            if (phoneNumber && phoneNumber.startsWith('+1')) return { template: 'bienvenida_registro', lang: 'en_US' };
            // Por defecto usar español
            return { template: 'registro_exitoso_888cargo', lang: 'es_CO' };
        };

        const chosen = decideTemplate(countryParam, formattedPhone);

        const messageData = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: 'template',
            template: {
                name: chosen.template,
                language: {
                    code: chosen.lang,
                    policy: 'deterministic'
                },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: name
                            }
                        ]
                    }
                ]
            }
        };

        // Se envía siempre con language.code = 'es' (configurado arriba)

        // Log request for debugging international delivery issues
        console.log('[WhatsApp] Sending message to:', formattedPhone, 'payload:', JSON.stringify(messageData));

        const response = await axios.post(`${config.baseUrl}/${config.phoneNumberId}/messages`, messageData, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env.WHATSAPP_TIMEOUT) || 30000
        });
        console.log('✅ Welcome WhatsApp message sent:', response.status, response.data);
        const messageId = response.data.messages?.[0]?.id;
        if (!messageId) {
            console.warn('[WhatsApp] No message id returned for', formattedPhone, 'response:', response.data);
        }
        return { success: true, message: 'Welcome WhatsApp message sent', messageId };

    } catch (error) {
        console.error('❌ Error sending welcome WhatsApp:', error.response?.data || error.message);
        // No lanzar error para no interrumpir el flujo de registro
        return { success: false, message: error.response?.data?.message || error.message };
    }
};

/**
 * Enviar documento (PDF) por WhatsApp
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} documentUrl - URL del documento a enviar
 * @param {string} caption - Texto opcional para el documento
 * @returns {Promise}
 */
export const sendDocumentWhatsApp = async (phone, documentUrl, caption = '') => {
    try {
        const config = getWhatsAppConfig();
        if (!config) {
            return { success: false, message: 'WhatsApp not configured' };
        }

        const formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone) {
            return { success: false, message: 'Invalid phone number' };
        }

        const messageData = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: 'document',
            document: {
                link: documentUrl,
                caption: caption
            }
        };

        const response = await axios.post(`${config.baseUrl}/${config.phoneNumberId}/messages`, messageData, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env.WHATSAPP_TIMEOUT) || 30000
        });

        console.log('✅ Document WhatsApp message sent:', response.data);
        return { success: true, message: 'Document WhatsApp message sent', messageId: response.data.messages?.[0]?.id };

    } catch (error) {
        console.error('❌ Error sending document WhatsApp:', error.response?.data || error.message);
        return { success: false, message: error.response?.data?.message || error.message };
    }
};

/**
 * Enviar confirmación de registro por WhatsApp (incluye username)
 */
export const sendRegistrationConfirmationWhatsApp = async (phone, name, username, countryParam = '') => {
    try {
        const config = getWhatsAppConfig();
        if (!config) {
            return { success: false, message: 'WhatsApp not configured' };
        }

        const formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone) {
            return { success: false, message: 'Invalid phone number' };
        }

        // Usar plantilla genérica de confirmación; si no existe, reutiliza la de bienvenida con usuario
        const templateName = 'registro_confirmacion_888cargo';

        const messageData = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'es_CO', policy: 'deterministic' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: name },
                            { type: 'text', text: username }
                        ]
                    }
                ]
            }
        };

        console.log('[WhatsApp] Sending registration confirmation to:', formattedPhone);
        const response = await axios.post(`${config.baseUrl}/${config.phoneNumberId}/messages`, messageData, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env.WHATSAPP_TIMEOUT) || 30000
        });

        console.log('✅ Registration confirmation WhatsApp sent:', response.data);
        return { success: true, message: 'Registration confirmation WhatsApp sent', messageId: response.data.messages?.[0]?.id };

    } catch (error) {
        console.error('❌ Error sending registration confirmation WhatsApp:', error.response?.data || error.message);
        return { success: false, message: error.response?.data?.message || error.message };
    }
};

export default {
    sendWelcomeWhatsApp,
    sendDocumentWhatsApp,
    formatPhoneNumber,
    sendRegistrationConfirmationWhatsApp
};
