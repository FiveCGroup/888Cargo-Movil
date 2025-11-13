// services/whatsapp.service.js
// Servicio para integración con WhatsApp Business API
import axios from 'axios';

export class WhatsAppService {
    
    static WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'EAAR2FtiknSwBPNmXMVhH5B75sq8cDrDQUOh4LF1ZAaifPrwJVlx1fNdxTGaXlwv7bPZBvqKYERwny6gzDkvQ26krKyXAOPvSm40lBgKSSB3XQxLS1pIb11PZB3y7HSfHsOaoLiAdkMmIOgQbvSeJRA1M1hvbQCPWUyZCe2XH40ZBQcgglmzZCa9hFZBDwp6hj10wAZDZD';
    static PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '814787335052261';
    static API_BASE_URL = 'https://graph.facebook.com/v22.0';

    // Códigos de idioma más comunes para español
    static SPANISH_LANGUAGE_CODES = {
        COLOMBIA: 'es_CO',
        ARGENTINA: 'es_AR', 
        MEXICO: 'es_MX',
        SPAIN: 'es_ES',
        GENERIC: 'es'
    };

    /**
     * Enviar mensaje de texto por WhatsApp
     * @param {string} phoneNumber - Número de teléfono destino
     * @param {string} message - Mensaje a enviar
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static async sendTextMessage(phoneNumber, message) {
        try {
            const response = await axios.post(
                `${this.API_BASE_URL}/${this.PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: phoneNumber,
                    type: "text",
                    text: { body: message }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Mensaje WhatsApp enviado exitosamente:', phoneNumber);
            return response.data;

        } catch (error) {
            console.error('❌ Error al enviar mensaje WhatsApp:', error.response?.data || error.message);
            throw new Error('Error al enviar mensaje por WhatsApp');
        }
    }

    /**
     * Enviar mensaje con template por WhatsApp
     * @param {string} phoneNumber - Número de teléfono destino
     * @param {string} templateName - Nombre del template
     * @param {Array} parameters - Parámetros del template
     * @param {string} languageCode - Código de idioma (default: "es_CO")
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static async sendTemplateMessage(phoneNumber, templateName, parameters = [], languageCode = "es_CO") {
        try {
            // Validar que el template name no esté vacío
            if (!templateName || templateName.trim() === '') {
                throw new Error('El nombre del template no puede estar vacío');
            }

            console.log(`📤 Enviando template "${templateName}" a ${phoneNumber}`);
            
            const response = await axios.post(
                `${this.API_BASE_URL}/${this.PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: phoneNumber,
                    type: "template",
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components: parameters.length > 0 ? [
                            {
                                type: "body",
                                parameters: parameters.map(param => ({
                                    type: "text",
                                    text: param
                                }))
                            }
                        ] : []
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Template WhatsApp enviado exitosamente:', phoneNumber);
            return response.data;

        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            console.error('❌ Error al enviar template WhatsApp:', {
                template: templateName,
                phone: phoneNumber,
                error: errorDetails
            });
            
            // Lanzar error con más contexto
            const errorMessage = error.response?.data?.error?.message || error.message;
            throw new Error(`Error al enviar template "${templateName}": ${errorMessage}`);
        }
    }

    /**
     * Verificar configuración de WhatsApp
     * @returns {boolean} - True si está configurado
     */
    static isConfigured() {
        return this.WHATSAPP_TOKEN !== 'TU_TOKEN_DE_ACCESO' && 
               this.PHONE_NUMBER_ID !== 'TU_PHONE_NUMBER_ID';
    }

    /**
     * Enviar mensaje con template y fallback a texto
     * @param {string} phoneNumber - Número de teléfono destino
     * @param {string} templateName - Nombre del template
     * @param {Array} parameters - Parámetros del template
     * @param {string} fallbackMessage - Mensaje de texto como fallback
     * @param {string} languageCode - Código de idioma (default: "es")
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static async sendTemplateWithFallback(phoneNumber, templateName, parameters = [], fallbackMessage, languageCode = "es") {
        try {
            // Intentar enviar con template primero
            return await this.sendTemplateMessage(phoneNumber, templateName, parameters, languageCode);
        } catch (templateError) {
            console.warn(`⚠️ Template "${templateName}" falló, usando mensaje de texto:`, templateError.message);
            
            // Fallback: enviar mensaje de texto
            if (!fallbackMessage) {
                throw new Error('No se pudo enviar template y no hay mensaje de fallback');
            }
            
            return await this.sendTextMessage(phoneNumber, fallbackMessage);
        }
    }

    /**
     * Obtener estado de configuración
     * @returns {Object} - Estado de la configuración
     */
    static getConfigurationStatus() {
        return {
            configured: this.isConfigured(),
            hasToken: this.WHATSAPP_TOKEN !== 'TU_TOKEN_DE_ACCESO',
            hasPhoneId: this.PHONE_NUMBER_ID !== 'TU_PHONE_NUMBER_ID'
        };
    }
}
