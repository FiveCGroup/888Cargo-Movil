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
    console.warn('Número sin código de país (+). Ingrese el número completo con código internacional (ej. +1XXXXXXXXXX):', cleaned);
    return null; // O lanza error para forzar corrección
};

/**
 * Enviar mensaje de bienvenida por WhatsApp
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} name - Nombre del usuario
 * @returns {Promise}
 */
export const sendWelcomeWhatsApp = async (phone, name) => {
    try {
        const config = getWhatsAppConfig();
        if (!config) {
            return { success: false, message: 'WhatsApp not configured' };
        }

        const formattedPhone = formatPhoneNumber(phone);
        if (!formattedPhone) {
            return { success: false, message: 'Invalid phone number' };
        }

        // Determinar el lenguaje basado en el código de país
        const hispanicCodes = ['+57', '+34', '+52', '+54', '+56', '+58', '+591', '+503', '+505', '+506', '+507', '+51', '+53', '+595', '+598', '+593', '+502', '+504'];
        let language = 'en_CO'; // Inglés por defecto para países no hispanohablantes ni chinos
        if (hispanicCodes.some(code => formattedPhone.startsWith(code))) {
            language = 'es_CO'; // Español para países hispanohablantes
        } else if (formattedPhone.startsWith('+86')) {
            language = 'es_CO'; // Chino simplificado para China
        } else if (formattedPhone.startsWith('+1')) {
            language = 'es_CO'; // Usar español aprobado para EE.UU. mientras se aprueba en_US
        }

        const messageData = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: 'template',
            template: {
                name: 'registro_exitoso_888cargo',
                language: {
                    code: language,
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

        const response = await axios.post(`${config.baseUrl}/${config.phoneNumberId}/messages`, messageData, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env.WHATSAPP_TIMEOUT) || 30000
        });

        console.log('✅ Welcome WhatsApp message sent:', response.data);
        return { success: true, message: 'Welcome WhatsApp message sent', messageId: response.data.messages?.[0]?.id };

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

export default {
    sendWelcomeWhatsApp,
    sendDocumentWhatsApp,
    formatPhoneNumber
};
