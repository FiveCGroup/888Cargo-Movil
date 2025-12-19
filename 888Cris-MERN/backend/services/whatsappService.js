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
    
    // Si comienza con 0, remover el 0 y agregar +57 (Colombia por defecto)
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Si no comienza con +, agregar código de país
    if (!cleaned.startsWith('+')) {
        // Asegurar que es un número de celular válido (comienza con 3 para Colombia)
        if (cleaned.startsWith('3')) {
            cleaned = '+57' + cleaned;
        } else {
            // Código por defecto para números cortos
            cleaned = '+57' + cleaned;
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
            to: formattedPhone.replace('+', ''), // Sin el +
            type: 'template',
            template: {
                name: 'bienvenida_registro',
                language: {
                    code: 'es_CO',
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

export default {
    sendWelcomeWhatsApp,
    formatPhoneNumber
};
