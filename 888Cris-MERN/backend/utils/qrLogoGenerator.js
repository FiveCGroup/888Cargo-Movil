// utils/qrLogoGenerator.js
// Genera un QR con logo en el centro usando node-canvas y qrcode (implementación del lado del servidor)

import QRCode from 'qrcode';
import { access } from 'fs/promises';

// Función para cargar canvas de forma segura
let canvasModule = null;
let canvasAvailable = false;

async function loadCanvas() {
    if (canvasModule !== null) {
        return canvasAvailable;
    }
    
    try {
        canvasModule = await import('canvas');
        canvasAvailable = true;
        console.log('✅ Módulo canvas cargado correctamente');
        return true;
    } catch (canvasError) {
        console.error('❌ Error cargando módulo canvas:', canvasError.message);
        console.warn('⚠️ Generando QRs sin logo (solo datos)');
        canvasAvailable = false;
        return false;
    }
}

/**
 * Genera un buffer PNG de un QR con logo en el centro.
 * @param {string} text - Contenido del QR (JSON string o cualquier string).
 * @param {string|null} logoPath - Ruta absoluta al logo PNG. Si es null, se genera sin logo.
 * @param {object} [options] - Opciones de QR (width, margin, errorCorrectionLevel, etc).
 * @returns {Promise<Buffer>} Buffer PNG del QR generado.
 */
export async function generateQRWithLogo(text, logoPath, options = {}) {
    try {
        // Validar que text sea un string
        if (!text || typeof text !== 'string') {
            throw new Error('El contenido del QR debe ser un string válido');
        }

        // Validar que el texto no sea demasiado largo para un QR code
        // Los QR codes tienen límites de capacidad dependiendo del nivel de corrección de errores:
        // - Nivel L (Low): ~2953 bytes
        // - Nivel M (Medium): ~2331 bytes  
        // - Nivel Q (Quartile): ~1663 bytes
        // - Nivel H (High): ~1273 bytes (más seguro pero menos capacidad)
        const MAX_QR_BYTES = 1200; // Usamos un límite seguro con nivel H
        
        // Calcular el tamaño aproximado en bytes (UTF-8)
        let textBytes = Buffer.byteLength(text, 'utf8');
        
        if (textBytes > MAX_QR_BYTES) {
            console.warn(`⚠️ El contenido del QR es demasiado grande (${textBytes} bytes), truncando o usando solo identificador`);
            // Si es demasiado grande, intentar usar solo una parte o el identificador
            if (text.length > 100) {
                // Si parece ser un código largo, usar solo los primeros caracteres
                text = text.substring(0, 100);
                console.warn(`⚠️ Contenido truncado a 100 caracteres`);
            }
            
            // Re-validar después del truncamiento y actualizar textBytes
            textBytes = Buffer.byteLength(text, 'utf8');
            if (textBytes > MAX_QR_BYTES) {
                throw new Error(`El contenido del QR es demasiado grande (${textBytes} bytes). Máximo permitido: ${MAX_QR_BYTES} bytes`);
            }
        }

        // Opciones de QR
        const size = options.width || 300;
        const margin = options.margin || 2;

        // Intentar cargar canvas si aún no se ha cargado
        const isCanvasAvailable = await loadCanvas();

        // Si canvas no está disponible, generar QR básico sin logo usando qrcode
        if (!isCanvasAvailable) {
            console.warn('⚠️ Canvas no disponible, generando QR básico sin logo');
            // Usar textBytes ya calculado (después de posible truncamiento)
            const errorCorrectionLevel = textBytes > 500 ? 'M' : 'H';
            const qrDataURL = await QRCode.toDataURL(text, {
                errorCorrectionLevel: errorCorrectionLevel,
                width: size,
                margin: margin,
                color: options.color || { dark: '#000000', light: '#FFFFFF' }
            });
            
            // Convertir data URL a buffer
            const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        }

        // Generar QR con canvas (versión completa con logo)
        const { createCanvas, loadImage } = canvasModule;
        const canvas = createCanvas(size, size);
        
        // Generar el QR en el canvas
        // Usar nivel M si el texto es grande, H si es pequeño (para mejor calidad con logo)
        // Usar textBytes ya calculado (después de posible truncamiento)
        const errorCorrectionLevel = textBytes > 500 ? 'M' : 'H';
        
        await QRCode.toCanvas(canvas, text, {
            errorCorrectionLevel: errorCorrectionLevel,
            width: size,
            margin: margin,
            color: options.color || { dark: '#000000', light: '#FFFFFF' }
        });

        // Cargar el logo y dibujarlo en el centro solo si logoPath existe
        if (logoPath) {
            try {
                // Verificar que el archivo existe
                await access(logoPath);
                
                const ctx = canvas.getContext('2d');
                const { loadImage } = canvasModule;
                const logo = await loadImage(logoPath);
                const logoSize = Math.floor(size * (options.logoSize || 0.22));
                const x = (size - logoSize) / 2;
                const y = (size - logoSize) / 2;
                
                // Fondo redondeado con color #17243f
                ctx.save();
                ctx.beginPath();
                ctx.arc(size/2, size/2, logoSize/2 + (options.logoBorder || 6), 0, 2 * Math.PI, false);
                ctx.fillStyle = options.logoBgColor || '#17243f';
                ctx.fill();
                ctx.restore();
                
                // Logo
                ctx.drawImage(logo, x, y, logoSize, logoSize);
            } catch (logoError) {
                console.warn(`⚠️ No se pudo cargar el logo desde ${logoPath}:`, logoError.message);
                // Continuar sin logo si hay error
            }
        }
        
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('❌ Error en generateQRWithLogo:', error);
        console.error('Stack:', error.stack);
        
        // Fallback: intentar generar QR básico sin canvas
        try {
            console.log('🔄 Intentando fallback: QR básico sin canvas');
            // Re-obtener size y margin en caso de que hayan fallado antes
            const fallbackSize = options.width || 300;
            const fallbackMargin = options.margin || 2;
            
            const qrDataURL = await QRCode.toDataURL(text, {
                errorCorrectionLevel: 'M',
                width: fallbackSize,
                margin: fallbackMargin
            });
            const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        } catch (fallbackError) {
            console.error('❌ Error en fallback también:', fallbackError);
            throw new Error(`No se pudo generar el QR: ${error.message}`);
        }
    }
}
