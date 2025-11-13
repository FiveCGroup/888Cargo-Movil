// utils/qrLogoGenerator.js
// Genera un QR con logo en el centro usando node-canvas y qrcode (implementación del lado del servidor)



import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';
import path from 'path';

/**
 * Genera un buffer PNG de un QR con logo en el centro.
 * @param {string} text - Contenido del QR (JSON string).
 * @param {string} logoPath - Ruta absoluta al logo PNG.
 * @param {object} [options] - Opciones de QR (size, errorCorrectionLevel, etc).
 * @returns {Promise<Buffer>} Buffer PNG del QR generado.
 */
export async function generateQRWithLogo(text, logoPath, options = {}) {
    // Opciones de QR
    const size = options.width || 300;
    const canvas = createCanvas(size, size);
    // Generar el QR en el canvas
    await QRCode.toCanvas(canvas, text, {
        errorCorrectionLevel: 'H',
        width: size,
        margin: options.margin || 2,
        color: options.color || { dark: '#000000', light: '#FFFFFF' }
    });

    // Cargar el logo y dibujarlo en el centro
    if (logoPath) {
        const ctx = canvas.getContext('2d');
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
    }
    return canvas.toBuffer('image/png');
}
