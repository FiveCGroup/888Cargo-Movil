// services/pdf.service.js
// Servicio para generación de PDFs
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs/promises";
import { getCajasByArticulo } from "../models/caja.model.js";
import { getQRsByCaja } from "../models/qr.model.js";
import { generateQRWithLogo } from "../utils/qrLogoGenerator.js";

export class PDFService {
    
    /**
     * Generar PDF para un artículo
     * @param {Object} articulo - Datos del artículo
     * @param {Array} cajas - Cajas del artículo
     * @returns {Promise<string>} - HTML del PDF
     */
    static async generarPDFArticulo(articulo, cajas) {
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Códigos QR - ${articulo.ref_art || "Artículo"}</title>
            <style>
                ${this.getBasicStyles()}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Códigos QR</h1>
                <h2>Artículo: ${articulo.ref_art || "Sin referencia"}</h2>
                <p>${articulo.descripcion_espanol || "Sin descripción"}</p>
                <p>Total de cajas: ${cajas[0]?.total_cajas || cajas.length}</p>
            </div>
            <div class="qr-grid">
        `;

        for (const caja of cajas) {
            const qrs = await getQRsByCaja(caja.id_caja);
            if (qrs.length > 0) {
                const qr = qrs[0];
                const imageData = await this.getImageBase64(qr.url_imagen);
                
                htmlContent += `
                <div class="qr-item">
                    <div class="caja-info">Caja ${caja.numero_caja} de ${caja.total_cajas}</div>
                    ${imageData ? 
                        `<img src="data:image/png;base64,${imageData}" class="qr-image" alt="QR Code" />` :
                        `<div class="qr-image no-image">Imagen QR no disponible</div>`
                    }
                </div>
                `;
            }
        }

        htmlContent += `
            </div>
        </body>
        </html>
        `;

        return htmlContent;
    }

    /**
     * Generar PDF para una carga completa
     * @param {Object} carga - Datos de la carga
     * @param {Array} articulos - Artículos de la carga
     * @param {string} qrImagesDir - Directorio de imágenes QR
     * @returns {Promise<Buffer>} - Buffer del PDF
     */
    static async generarPDFCarga(carga, articulos, qrImagesDir) {
        // Recopilar todos los QRs de la carga
        const todosLosQRs = [];

    // Ruta absoluta al logo (ahora en backend/assets)
    const url = (await import('url')).default;
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const logoPath = path.resolve(__dirname, '../assets/888cargo-logo.png');

        for (const articulo of articulos) {
            const cajas = await getCajasByArticulo(articulo.id_articulo);
            for (const caja of cajas) {
                const qrs = await getQRsByCaja(caja.id_caja);
                if (qrs.length > 0) {
                    const qr = qrs[0];
                    // El contenido del QR debe ser el JSON completo si está disponible
                    const qrContent = qr.datos_qr || qr.codigo_qr;
                    try {
                        // Generar QR con logo en el centro, corrección H, módulos redondeados
                        const qrBuffer = await generateQRWithLogo(qrContent, logoPath, {
                            width: 280,
                            height: 280,
                            errorCorrectionLevel: 'H',
                            logo: {
                                borderRadius: 12,
                                borderSize: 6,
                                borderColor: '#fff',
                            },
                            // Puedes agregar más opciones de estilo aquí
                        });
                        const base64Image = qrBuffer.toString('base64');
                        todosLosQRs.push({
                            codigo_qr: qr.codigo_qr,
                            numero_caja: caja.numero_caja,
                            total_cajas: caja.total_cajas,
                            ref_art: articulo.ref_art || articulo.codigo_producto || '',
                            descripcion: articulo.descripcion_espanol || articulo.descripcion || '',
                            ciudad_destino: carga.ciudad_destino || '',
                            destinatario: carga.nombre_cliente || '',
                            serial: articulo.serial || '',
                            cantidad: caja.cantidad_en_caja || articulo.cantidad || '',
                            peso: caja.gw || articulo.gw || '',
                            base64Image: base64Image,
                        });
                    } catch (err) {
                        console.error('❌ Error generando QR con logo:', err);
                        todosLosQRs.push({
                            codigo_qr: qr.codigo_qr,
                            numero_caja: caja.numero_caja,
                            total_cajas: caja.total_cajas,
                            ref_art: articulo.ref_art || articulo.codigo_producto || '',
                            descripcion: articulo.descripcion_espanol || articulo.descripcion || '',
                            ciudad_destino: carga.ciudad_destino || '',
                            destinatario: carga.nombre_cliente || '',
                            serial: articulo.serial || '',
                            cantidad: caja.cantidad_en_caja || articulo.cantidad || '',
                            peso: caja.gw || articulo.gw || '',
                            base64Image: null,
                        });
                    }
                }
            }
        }

        if (todosLosQRs.length === 0) {
            throw new Error("No se encontraron códigos QR para esta carga");
        }

        // Generar HTML
        const htmlContent = this.generarHTMLCarga(carga, todosLosQRs);

        // Generar PDF con Puppeteer
        return await this.htmlToPDF(htmlContent);
    }

    /**
     * Generar HTML para PDF de carga
     * @param {Object} carga - Datos de la carga
     * @param {Array} qrs - QRs a incluir
     * @returns {string} - HTML completo
     */
    static generarHTMLCarga(carga, qrs) {
        console.log("🔥 GENERANDO PDF CON NUEVA ESTRUCTURA:", new Date().toISOString());
        console.log("📊 Datos recibidos:", { 
            codigo: carga.codigo_carga, 
            cliente: carga.nombre_cliente, 
            totalQRs: qrs.length 
        });
        
        // Cada QR ocupa una hoja completa
        const totalPages = qrs.length;

        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>888 Cargo - Códigos QR ${carga.codigo_carga}</title>
            <style>
                ${this.getAdvancedStyles()}
            </style>
        </head>
        <body>
        `;

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const qr = qrs[pageIndex];
            // Truncar descripción a 70 caracteres máx (1 línea)
            const descripcionTrunc = (qr.descripcion || "Sin descripción").length > 80 ? (qr.descripcion || "Sin descripción").slice(0, 77) + '…' : (qr.descripcion || "Sin descripción");
            htmlContent += `
            <div class="page">
                <div class="header">
                    <h1 class="company-title">888 Cargo</h1>
                    <h2 class="carga-code">${carga.codigo_carga}</h2>
                    <div class="carga-details">
                        <div class="detail-row"><strong>Cliente:</strong> ${carga.nombre_cliente || "Sin información"}</div>
                        <div class="detail-row"><strong>Fecha de creación:</strong> ${carga.fecha_inicio ? new Date(carga.fecha_inicio).toLocaleDateString("es-ES") : new Date().toLocaleDateString("es-ES")}</div>
                        <div class="detail-row"><strong>Total de códigos QR:</strong> ${qrs.length}</div>
                    </div>
                    <div class="page-range">QR ${pageIndex + 1} de ${qrs.length}</div>
                </div>
                <div class="qr-fullpage">
                    <div class="qr-item">
                        <div class="caja-title">Caja ${qr.numero_caja} de ${qr.total_cajas}</div>
                        ${qr.base64Image
                            ? `<img src="data:image/png;base64,${qr.base64Image}" class="qr-image qr-image-large" alt="QR Code Caja ${qr.numero_caja}" />`
                            : `<div class="qr-image no-image">QR no disponible</div>`
                        }
                        <div class="qr-caja-info">
                            <div class="qr-desc-line"><span class="qr-desc-label">${descripcionTrunc}</span></div>
                            <div class="qr-info-row"><span class="qr-label">Ref:</span> <span>${qr.ref_art || '-'}</span></div>
                            <div class="qr-info-row"><span class="qr-label">Destino:</span> <span>${qr.ciudad_destino || '-'}</span></div>
                            <div class="qr-info-row"><span class="qr-label">Serial:</span> <span>${qr.serial || '-'}</span></div>
                            <div class="qr-info-row"><span class="qr-label">Qty:</span> <span>${qr.cantidad || '-'}</span></div>
                            <div class="qr-info-row"><span class="qr-label">Peso:</span> <span>${qr.peso ? (parseFloat(qr.peso).toFixed(2) + ' kg') : '-'}</span></div>
                            <div class="qr-info-row qr-caja-bold">Caja <b>${qr.numero_caja}</b> de <b>${qr.total_cajas}</b></div>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    888 Cargo - Sistema de Gestión de Packing Lists | Página ${pageIndex + 1} de ${totalPages}
                </div>
            </div>
            `;
        }

        htmlContent += `
        </body>
        </html>
        `;

        console.log("✅ HTML ACTUALIZADO generado exitosamente, longitud:", htmlContent.length);
        return htmlContent;
    }

    /**
     * Convertir HTML a PDF usando Puppeteer
     * @param {string} htmlContent - HTML a convertir
     * @returns {Promise<Buffer>} - Buffer del PDF
     */
    static async htmlToPDF(htmlContent) {
        console.log("🖨️ Generando PDF con Puppeteer...");

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent);

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "10mm",
                right: "10mm",
                bottom: "10mm",
                left: "10mm",
            },
        });

        await browser.close();

        console.log(`✅ PDF generado exitosamente (${pdfBuffer.length} bytes)`);
        return pdfBuffer;
    }

    /**
     * Obtener imagen en base64
     * @param {string} imagePath - Ruta de la imagen
     * @returns {Promise<string|null>} - Imagen en base64 o null
     */
    static async getImageBase64(imagePath) {
        try {
            const fullPath = path.join(process.cwd(), imagePath);
            const imageBuffer = await fs.readFile(fullPath);
            return imageBuffer.toString("base64");
        } catch (error) {
            console.error(`❌ Error al leer imagen: ${imagePath}`, error);
            return null;
        }
    }

    /**
     * Estilos básicos para PDFs simples
     * @returns {string} - CSS
     */
    static getBasicStyles() {
        return `
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px;
                background: white;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .qr-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 30px;
                margin-top: 20px;
            }
            .qr-item {
                border: 2px solid #333;
                padding: 20px;
                text-align: center;
                border-radius: 10px;
                background: #f9f9f9;
            }
            .qr-image {
                max-width: 200px;
                height: auto;
                margin: 10px 0;
            }
            .no-image {
                width: 200px;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f0f0f0;
                color: #666;
                margin: 10px auto;
            }
            .caja-info {
                font-weight: bold;
                font-size: 18px;
                color: #333;
            }
        `;
    }

    /**
     * Estilos avanzados para PDFs complejos
     * @returns {string} - CSS
     */
    static getAdvancedStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body { 
                font-family: Arial, sans-serif;
                color: #333;
                background: white;
            }
            .page {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                margin: 0 auto;
                background: white;
                page-break-after: always;
            }
            .page:last-child {
                page-break-after: auto;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 3px solid #333;
            }
            .company-title {
                font-size: 32px !important;
                margin-bottom: 10px !important;
                color: #FF0000 !important;
                background: #FFFF00 !important;
                font-weight: bold !important;
                padding: 10px !important;
                text-align: center !important;
                display: block !important;
            }
            .carga-code {
                font-size: 24px !important;
                margin-bottom: 15px !important;
                color: #2c3e50 !important;
                font-weight: bold !important;
                text-align: center !important;
            }
            .carga-details {
                margin: 15px 0;
                text-align: left;
                font-size: 14px;
            }
            .detail-row {
                margin-bottom: 8px;
                color: #34495e;
                font-size: 14px;
            }
            .page-range {
                font-size: 12px !important;
                color: #7f8c8d !important;
                margin-top: 15px !important;
                font-weight: normal !important;
                text-align: center !important;
                background: #f8f9fa !important;
                padding: 5px !important;
                border-radius: 5px !important;
            }
            .qr-fullpage {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 60vh;
                margin-top: 40px;
            }
            .qr-item {
                border: 2px solid #2c3e50;
                border-radius: 10px;
                padding: 30px 15px 18px 15px;
                text-align: center;
                background: #f8f9fa;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 100%;
                max-width: 420px;
                margin: 0 auto;
            }
            .qr-image-large {
                width: 260px !important;
                height: 260px !important;
                margin: 20px 0 10px 0 !important;
                border: 2px solid #1976d2 !important;
                border-radius: 10px !important;
            }
            .caja-title {
                font-weight: bold;
                font-size: 16px;
                color: #2c3e50;
                margin-bottom: 8px;
            }
            .qr-caja-info {
                width: 100%;
                margin-top: 8px;
                text-align: left;
                font-size: 14px;
            }
            .qr-desc-line {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 2px;
                color: #222;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .qr-label {
                font-weight: 600;
                margin-right: 4px;
            }
            .qr-info-row {
                font-size: 14px;
                margin-bottom: 1px;
                display: flex;
                align-items: center;
            }
            .qr-caja-bold {
                font-weight: bold;
                margin-top: 4px;
                font-size: 14px;
                text-align: right;
            }
            .qr-image {
                width: 120px !important;
                height: 120px !important;
                margin: 10px 0 !important;
                border: 1px solid #ddd !important;
                border-radius: 5px !important;
            }
            .no-image {
                width: 120px !important;
                height: 120px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: #ecf0f1 !important;
                color: #7f8c8d !important;
                border: 1px solid #ddd !important;
                border-radius: 5px !important;
                font-size: 12px !important;
            }
            .footer {
                position: fixed;
                bottom: 10mm;
                left: 20mm;
                right: 20mm;
                text-align: center;
                font-size: 12px;
                color: #7f8c8d;
                border-top: 1px solid #bdc3c7;
                padding-top: 10px;
            }
            @media print {
                .page {
                    margin: 0;
                    width: auto;
                    min-height: auto;
                }
                .footer {
                    position: fixed;
                    bottom: 10mm;
                }
            }
        `;
    }
}
