// services/qr-data.service.js
// Servicio optimizado para códigos QR basados en datos (sin archivos)
import { generateQRWithLogo } from '../utils/qrLogoGenerator.js';
import { BaseService } from './base.service.js';
import qrRepository from '../repositories/qr.repository.js';

/**
 * Servicio optimizado para códigos QR basados en datos
 * No genera archivos físicos, solo almacena datos para generación dinámica
 */
export class QRDataService extends BaseService {
    constructor() {
        super('QRDataService');
        this.defaultQROptions = {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        };
    }

    /**
     * Generar datos QR para una caja específica
     */
    async generateQRDataForCaja(caja) {
        try {
            console.log(`✅ Generando QR optimizado para caja ${caja.numero_caja} de ${caja.total_cajas}`);
            console.log(`🔍 Datos de entrada de caja:`, JSON.stringify(caja, null, 2));
            
            // Crear código único para la caja
            const codigoQR = this.generateUniqueQRCode(
                caja.codigo_carga, 
                caja.id_articulo, 
                caja.numero_caja
            );


            // Obtener datos completos del artículo asociado
            const { get: getArticulo, query } = await import('../db.js');
            const articulo = await getArticulo('SELECT * FROM articulo_packing_list WHERE id_articulo = ?', [caja.id_articulo]);
            console.log(`🔍 Datos del artículo obtenidos:`, JSON.stringify(articulo, null, 2));

            // Obtener datos de la carga para el destino
            const carga = await getArticulo('SELECT * FROM carga WHERE id_carga = ?', [articulo?.id_carga]);
            console.log(`🔍 Datos de la carga obtenidos:`, JSON.stringify(carga, null, 2));

            // Combinar datos relevantes de caja, artículo y carga
            const qrContent = {
                qr_id: null, // Se asignará después de guardar en BD
                codigo_unico: codigoQR,
                numero_caja: caja.numero_caja,
                total_cajas: caja.total_cajas,
                codigo_carga: caja.codigo_carga,
                descripcion: caja.descripcion_contenido || articulo?.descripcion_espanol || articulo?.descripcion || '-',
                ref_art: caja.ref_art || articulo?.ref_art || articulo?.codigo_producto || '-',
                destino: carga?.destino || carga?.direccion_destino || '-',
                direccion_destino: carga?.direccion_destino || null,
                peso: caja.gw || articulo?.gw || '-',
                cbm: caja.cbm || articulo?.cbm || '-',
                imagen_url: articulo?.imagen_url || null,
                timestamp: new Date().toISOString(),
                version: '2.3' // Versión con destino correcto (ciudad) y dirección
            };

            console.log(`🔍 Contenido QR final:`, JSON.stringify(qrContent, null, 2));


            // Convertir a string para almacenar
            const datosQR = JSON.stringify(qrContent);

            // Crear registro en base de datos usando SQL directo
            const { run, get } = await import('../db.js');
            const result = await run(`
                INSERT INTO qr (id_caja, codigo_qr, tipo_qr, datos_qr, contenido_json, estado, opciones_render)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                caja.id_caja,
                codigoQR,
                'caja',
                datosQR,
                datosQR,
                'generado',
                JSON.stringify(this.defaultQROptions)
            ]);

            // Actualizar el ID en el contenido
            qrContent.qr_id = result.id;
            const updatedDatosQR = JSON.stringify(qrContent);
            // Actualizar el registro con el ID correcto
            await run(`
                UPDATE qr SET datos_qr = ?, contenido_json = ? WHERE id_qr = ?
            `, [updatedDatosQR, updatedDatosQR, result.id]);

            console.log(`✅ QR ${result.id} creado exitosamente para caja ${caja.numero_caja}`);

            return {
                success: true,
                data: {
                    id_qr: result.id,
                    codigo_qr: codigoQR,
                    caja: caja,
                    datos_qr: updatedDatosQR,
                    qr_content: qrContent
                },
                message: 'QR generado como datos exitosamente'
            };

        } catch (error) {
            console.error(`❌ Error generando QR para caja ${caja.numero_caja}:`, error);
            return {
                success: false,
                message: 'Error generando datos QR para caja',
                error: error.message
            };
        }
    }

    /**
     * Regenerar QRs de una carga con la nueva estructura de datos
     */
    async regenerateQRsForCarga(idCarga) {
        try {
            console.log(`🔄 Regenerando QRs para carga ${idCarga}`);
            
            const { query, run, get } = await import('../db.js');
            
            // Obtener todas las cajas de la carga con información del artículo y carga
            const cajas = await query(`
                SELECT c.*, a.ref_art, a.descripcion_espanol, a.serial, a.gw, a.cbm, a.unidades_empaque,
                       car.codigo_carga, car.direccion_destino
                FROM caja c
                INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
                INNER JOIN carga car ON a.id_carga = car.id_carga
                WHERE car.id_carga = ?
                ORDER BY c.numero_caja
            `, [idCarga]);

            console.log(`📦 Encontradas ${cajas.length} cajas para regenerar`);

            for (const caja of cajas) {
                try {
                    // Eliminar QR existente si existe
                    await run('DELETE FROM qr WHERE id_caja = ?', [caja.id_caja]);
                    
                    // Generar nuevo QR con datos completos
                    const resultado = await this.generateQRDataForCaja(caja);
                    
                    if (resultado.success) {
                        console.log(`✅ QR regenerado para caja ${caja.numero_caja} de ${caja.total_cajas}`);
                    } else {
                        console.warn(`⚠️ Error regenerando QR para caja ${caja.numero_caja}:`, resultado.message);
                    }
                } catch (error) {
                    console.error(`❌ Error regenerando QR para caja ${caja.numero_caja}:`, error);
                }
            }

            return {
                success: true,
                message: `QRs regenerados para ${cajas.length} cajas`,
                data: { cajasProcessed: cajas.length }
            };

        } catch (error) {
            console.error('❌ Error regenerando QRs para carga:', error);
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    /**
     * Generar código QR único
     */
    generateUniqueQRCode(codigoCarga, articuloId, numeroCaja) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `QRD_${codigoCarga}_${articuloId}_${numeroCaja}_${timestamp}_${random}`;
    }

    /**
     * Obtener cajas de una carga
     */
    async getCajasFromCarga(idCarga) {
        const { query } = await import('../db.js');
        
        const sql = `
            SELECT 
                c.*,
                a.descripcion_espanol,
                a.ref_art,
                a.id_articulo,
                carga.codigo_carga
            FROM caja c
            INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
            INNER JOIN carga ON a.id_carga = carga.id_carga
            WHERE carga.id_carga = ?
            ORDER BY a.id_articulo, c.numero_caja
        `;
        
        return await query(sql, [idCarga]);
    }

    /**
     * Obtener QRs de una carga con datos parseados
     */
    async getQRDataForCarga(idCarga) {
        try {
            console.log(`📊 Obteniendo datos QR para carga ${idCarga}`);

            const { query } = await import('../db.js');
            
            const sql = `
                SELECT 
                    q.*, 
                    c.numero_caja,
                    c.total_cajas,
                    a.id_articulo,
                    a.descripcion_espanol,
                    a.ref_art,
                    carga.codigo_carga
                FROM qr q
                INNER JOIN caja c ON q.id_caja = c.id_caja
                INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
                INNER JOIN carga ON a.id_carga = carga.id_carga
                WHERE carga.id_carga = ?
                ORDER BY a.id_articulo, c.numero_caja
            `;
            
            const qrs = await query(sql, [idCarga]);
            
            const qrDataList = qrs.map(qr => {
                let parsedData = null;
                try {
                    parsedData = JSON.parse(qr.datos_qr);
                } catch (e) {
                    console.warn(`⚠️ Error parseando datos QR ${qr.id_qr}:`, e);
                }

                return {
                    ...qr,
                    parsed_data: parsedData,
                    has_valid_data: parsedData !== null
                };
            });

            return {
                success: true,
                data: {
                    idCarga,
                    qrs: qrDataList,
                    total: qrDataList.length,
                    valid_qrs: qrDataList.filter(q => q.has_valid_data).length
                },
                message: `Encontrados ${qrDataList.length} QRs para la carga`
            };

        } catch (error) {
            console.error(`❌ Error obteniendo datos QR de carga:`, error);
            return {
                success: false,
                message: 'Error obteniendo datos QR de carga',
                error: error.message
            };
        }
    }

    /**
     * Generar datos QR para una carga completa (función faltante para el controlador)
     */
    async generateQRDataForCarga(idCarga) {
        try {
            console.log(`🔧 Generando datos QR para carga completa ${idCarga}`);

            // Obtener cajas de la carga
            const cajas = await this.getCajasFromCarga(idCarga);
            
            if (!cajas || cajas.length === 0) {
                return {
                    success: false,
                    message: 'No se encontraron cajas para esta carga',
                    data: { idCarga, total_cajas: 0 }
                };
            }

            const resultados = [];
            let exitosos = 0;
            let errores = 0;

            // Generar QR para cada caja
            for (const caja of cajas) {
                try {
                    const resultado = await this.generateQRDataForCaja(caja);
                    resultados.push(resultado);
                    
                    if (resultado.success) {
                        exitosos++;
                        console.log(`✅ QR generado para caja ${caja.numero_caja}`);
                    } else {
                        errores++;
                        console.error(`❌ Error en caja ${caja.numero_caja}: ${resultado.message}`);
                    }
                } catch (error) {
                    errores++;
                    console.error(`❌ Error procesando caja ${caja.numero_caja}:`, error);
                    resultados.push({
                        success: false,
                        message: `Error procesando caja ${caja.numero_caja}: ${error.message}`,
                        data: { caja }
                    });
                }
            }

            const todoExitoso = errores === 0;

            console.log(`📋 Resumen generación QR carga ${idCarga}: ${exitosos} exitosos, ${errores} errores`);

            return {
                success: todoExitoso,
                message: todoExitoso 
                    ? `Todos los QRs generados exitosamente para carga ${idCarga}`
                    : `QRs generados con algunos errores para carga ${idCarga}`,
                data: {
                    idCarga,
                    total_cajas: cajas.length,
                    exitosos,
                    errores,
                    resultados: resultados,
                    processed_at: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error(`❌ Error generando datos QR para carga completa ${idCarga}:`, error);
            return {
                success: false,
                message: 'Error generando datos QR para carga completa',
                error: error.message,
                data: { idCarga }
            };
        }
    }

    /**
     * Generar imagen QR desde datos almacenados (dinámico)
     */
    async generateQRImageFromData(qrId, options = {}) {
        try {
            // Opciones por defecto
            const qrOptions = {
                ...this.defaultQROptions,
                ...options
            };

            // Obtener datos del QR desde la base de datos
            const qrData = await qrRepository.findById(qrId);
            if (!qrData) {
                return {
                    success: false,
                    message: 'QR no encontrado'
                };
            }

            // Usar el JSON completo (datos_qr) como contenido del QR
            let qrContent = qrData.datos_qr;
            // Si por alguna razón no hay datos_qr, usar el código como fallback
            if (!qrContent) {
                qrContent = qrData.codigo_qr;
            }

            // Ruta absoluta al logo
            const path = (await import('path')).default;
            const url = (await import('url')).default;
            const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
            const logoPath = path.resolve(__dirname, '../assets/888cargo-logo.png');
            console.log('🔍 Logo path construido:', logoPath);
            // Importar función para generar QR con logo
            const { generateQRWithLogo } = await import('../utils/qrLogoGenerator.js');
            const qrImageBuffer = await generateQRWithLogo(qrContent, logoPath, qrOptions);

            // Marcar como impreso si se solicita
            if (options.markAsPrinted && !qrData.impreso) {
                await qrRepository.markAsPrinted(qrId);
            }

            return {
                success: true,
                message: 'Imagen QR generada exitosamente',
                data: {
                    image_buffer: qrImageBuffer,
                    qr_data: qrData,
                    generated_at: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('❌ Error generando imagen QR dinámica:', error);
            return {
                success: false,
                message: 'Error al generar imagen QR',
                error: error.message
            };
        }
    }

    /**
     * Validar QR escaneado con nueva estructura
     */
    async validateScannedQR(scannedData) {
        try {
            // Intentar parsear si es JSON
            let parsedData;
            try {
                parsedData = typeof scannedData === 'string' ? JSON.parse(scannedData) : scannedData;
            } catch {
                // Si no es JSON, tratar como código simple
                parsedData = { codigo_unico: scannedData };
            }

            // Buscar QR por código
            const qrData = await qrRepository.findByCode(
                parsedData.codigo_unico || parsedData.codigo_qr || scannedData
            );

            if (!qrData) {
                return {
                    success: false,
                    message: 'Código QR no válido o no encontrado'
                };
            }

            // Marcar como escaneado
            await qrRepository.markAsScanned(qrData.id);

            return {
                success: true,
                message: 'QR validado exitosamente',
                data: {
                    qr: qrData,
                    scanned_at: new Date().toISOString(),
                    version: parsedData.version || '1.0'
                }
            };

        } catch (error) {
            console.error('❌ Error validando QR escaneado:', error);
            return {
                success: false,
                message: 'Error al validar QR',
                error: error.message
            };
        }
    }

    /**
     * Generar PDF optimizado con QRs dinámicos
     */
    async generateOptimizedPDFForCarga(idCarga) {
        try {
            console.log(`📄 Generando PDF optimizado para carga ${idCarga}`);
            
            // Obtener datos QR de la carga
            const qrDataResult = await this.getQRDataForCarga(idCarga);
            if (!qrDataResult.success) {
                return qrDataResult;
            }

            const qrList = qrDataResult.data.qrs;
            if (qrList.length === 0) {
                return {
                    success: false,
                    message: 'No se encontraron QRs para esta carga'
                };
            }

            // Generar PDF usando datos dinámicos
            const pdfBuffer = await this.createOptimizedPDFWithQRs(qrList, idCarga);
            
            console.log(`✅ PDF optimizado generado para carga ${idCarga}`);
            
            return {
                success: true,
                data: pdfBuffer,
                message: `PDF generado con ${qrList.length} QRs dinámicos`
            };
            
        } catch (error) {
            console.error(`❌ Error generando PDF optimizado:`, error);
            return {
                success: false,
                message: 'Error generando PDF optimizado',
                error: error.message
            };
        }
    }

    /**
     * Crear PDF con QRs generados dinámicamente
     */
    async createOptimizedPDFWithQRs(qrList, idCarga) {
        try {
            console.log('[QRService] Starting optimized PDF creation');
            const PDFDocument = (await import('pdfkit')).default;
            const { get } = await import('../db.js');

            // Obtener datos de la carga y cliente
            const carga = await get(`SELECT c.codigo_carga, c.fecha_creacion, c.ciudad_destino, cli.nombre_cliente, cli.cliente_shippingMark FROM carga c LEFT JOIN clientes cli ON c.id_cliente = cli.id_cliente WHERE c.id_carga = ?`, [idCarga]);
            const codigoCarga = carga?.codigo_carga || idCarga;
            const nombreCliente = carga?.nombre_cliente || '';
            const clienteShippingMark = carga?.cliente_shippingMark || '';
            const ciudadDestino = carga?.ciudad_destino || '';
            const fechaCreacion = carga?.fecha_creacion ? new Date(carga.fecha_creacion).toLocaleDateString('es-ES') : '';
            const totalQR = qrList.length;

            return new Promise(async (resolve, reject) => {
                try {
                    const doc = new PDFDocument({ margin: 50 });
                    const chunks = [];

                    doc.on('data', chunk => chunks.push(chunk));
                    doc.on('end', () => {
                        console.log(`✅ PDF optimizado completado`);
                        resolve(Buffer.concat(chunks));
                    });

                    // --- ENCABEZADO PERSONALIZADO ---
                    let y = 50;
                    doc.fontSize(22).font('Helvetica-Bold').fillColor('#003366').text('888Cargo', { align: 'center' });
                    y += 30;
                    doc.fontSize(16).font('Helvetica-Bold').fillColor('black').text(`Carga: ${codigoCarga}`, { align: 'center' });
                    y += 22;
                    doc.fontSize(14).font('Helvetica').fillColor('black').text(nombreCliente, { align: 'center' });
                    y += 20;
                    doc.fontSize(12).font('Helvetica').fillColor('black').text(`Total de QR: ${totalQR}   Fecha: ${fechaCreacion}`, { align: 'center' });
                    y += 20;
                    doc.moveDown(1.5);

                    // Layout: 1 QR por página (centrado)
                    const pageWidth = doc.page.width - 100;
                    const pageHeight = doc.page.height - 200;
                    const qrSize = 150 * 2; // aumentado al 200% (x2)
                    const qrsPerPage = 1;

                    // Ruta absoluta al logo (usar import dinámico de path)
                    const path = (await import('path')).default;
                    const url = (await import('url')).default;
                    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
                    const logoPath = path.resolve(__dirname, '../assets/888cargo-logo.png');

                    for (let i = 0; i < qrList.length; i++) {
                        const qr = qrList[i];

                        // Nueva página por cada QR después de la primera
                        if (i > 0) {
                            doc.addPage();
                        }

                        // Calcular posición del contenedor centrado
                        const containerWidth = qrSize;
                        const containerHeight = qrSize; // el cuadro total será igual al tamaño actual del QR
                        const containerX = (doc.page.width - containerWidth) / 2;
                        const containerY = (doc.page.height - containerHeight) / 2 - 40; // desplazar un poco hacia arriba

                        // Dividir el contenedor horizontalmente: 40% arriba, 60% abajo
                        const topHeight = Math.floor(containerHeight * 0.4);
                        const bottomHeight = containerHeight - topHeight;

                        // Tamaño real del QR para caber en la mitad inferior (dejando pequeño margen)
                        const qrImageSize = Math.floor(bottomHeight * 0.9);
                        // Posición del QR dentro de la mitad inferior (centrado)
                        const x = containerX + Math.floor((containerWidth - qrImageSize) / 2);
                        const yQR = containerY + topHeight + Math.floor((bottomHeight - qrImageSize) / 2);

                        try {
                            // Generar imagen QR con logo en el centro
                            const qrImageBuffer = await generateQRWithLogo(qr.datos_qr, logoPath, {
                                width: qrSize,
                                height: qrSize,
                                errorCorrectionLevel: 'H',
                                logo: {
                                    borderRadius: 10,
                                    borderSize: 4,
                                    borderColor: '#fff',
                                }
                            });

                            // --- DIBUJAR CONTENEDOR Y BORDE AZUL ---
                            doc.save();
                            // rectángulo que contiene ambas secciones
                            doc.lineWidth(3).strokeColor('#1976d2').rect(containerX - 5, containerY - 5, containerWidth + 10, containerHeight + 10).stroke();
                            // línea divisoria entre secciones (40/60)
                            doc.moveTo(containerX, containerY + topHeight).lineTo(containerX + containerWidth, containerY + topHeight).stroke();
                            doc.restore();

                            // Insertar texto del cliente en la mitad superior (si existe)
                            if (clienteShippingMark) {
                                // Texto en mayúsculas que debe ocupar todo el espacio de la mitad superior
                                const text = String(clienteShippingMark).toUpperCase();
                                const padding = 8;
                                const maxWidth = containerWidth - padding * 2;
                                const maxHeight = topHeight - padding * 2;

                                // Label fijo encima del shipping mark (ajustado a 12px y alineado a la izquierda)
                                let labelFontSize = 12; // reducido a 12px
                                const labelSpacing = 6;

                                // Ajustar label si no hay suficiente espacio
                                if (labelFontSize + 6 >= maxHeight) {
                                    labelFontSize = Math.max(10, Math.floor(maxHeight * 0.2));
                                }

                                // Espacio disponible para el shipping mark debajo de la etiqueta
                                let availableHeight = maxHeight - labelFontSize - labelSpacing;
                                if (availableHeight < 6) availableHeight = Math.max(6, Math.floor(maxHeight * 0.4));

                                // Seleccionar fuente y calcular tamaño de fuente óptimo para el shipping mark
                                doc.font('Helvetica-Bold');
                                let fontSize = Math.min(96, Math.floor(availableHeight));
                                if (fontSize < 6) fontSize = 6;

                                // Reducir tamaño hasta que el ancho y la altura del texto quepan
                                while (fontSize >= 6) {
                                    doc.fontSize(fontSize);
                                    const textWidth = doc.widthOfString(text);
                                    const textHeight = fontSize * 1.1; // aproximación de altura de línea
                                    if (textWidth <= maxWidth && textHeight <= availableHeight) break;
                                    fontSize = Math.floor(fontSize * 0.9);
                                }

                                // Calcular posición vertical para centrar label + shippingMark en la mitad superior
                                const totalBlockHeight = labelFontSize + labelSpacing + fontSize;
                                const startY = containerY + Math.floor((topHeight - totalBlockHeight) / 2);

                                // Dibujar label alineado a la izquierda
                                doc.fontSize(labelFontSize)
                                   .font('Helvetica-Bold')
                                   .fillColor('black')
                                   .text('Shipping Mark:', containerX + padding, startY, {
                                       width: containerWidth - padding * 2,
                                       align: 'left'
                                   });

                                // Dibujar shipping mark debajo del label
                                const shippingY = startY + labelFontSize + labelSpacing;
                                doc.fontSize(fontSize)
                                   .fillColor('#17243f')
                                   .text(text, containerX + padding, shippingY, {
                                       width: containerWidth - padding * 2,
                                       align: 'center'
                                   });
                            }

                                     // Layout: QR alineado a la derecha del área inferior y texto a la izquierda
                                     const gap = 10; // espacio entre texto y QR
                                     const paddingInner = 8;

                                     // QR en el lado derecho del contenedor inferior (manteniendo qrImageSize)
                                     const qrX = containerX + containerWidth - paddingInner - qrImageSize;
                                     const qrY = containerY + topHeight + Math.floor((bottomHeight - qrImageSize) / 2);
                                     doc.image(qrImageBuffer, qrX, qrY, { 
                                          width: qrImageSize, 
                                          height: qrImageSize 
                                     });


                                    // Información de la caja en el espacio libre a la izquierda del QR dentro de la mitad inferior
                                    const parsedData = qr.parsed_data || JSON.parse(qr.datos_qr);
                                    const leftX = containerX + paddingInner;
                                    const leftWidth = qrX - gap - leftX; // espacio disponible para texto
                                    const textBlockTop = containerY + topHeight + paddingInner;
                                    const textBlockHeight = bottomHeight - paddingInner * 2;

                                    // --- BLOQUE DE INFORMACIÓN ESTILIZADA CENTRADO ---
                                    const lineHeight = 15;
                                    const fontSizeDesc = 13;
                                    const fontSizeLabel = 9;
                                    const fontSizeValue = 11;
                                    const fontSizeCaja = 12;
                                    const colorLabel = '#666666';
                                    const colorValue = '#000000';
                                    const colorAccent = '#1976d2';
                                    
                                    // Calcular altura total aproximada del contenido
                                    const destino = (parsedData.destino || '-').trim();
                                    const destinoWidth = doc.widthOfString(destino, { fontSize: fontSizeValue });
                                    const availableWidth = leftWidth - 32;
                                    let destinoLines = 1;
                                    if (destinoWidth > availableWidth || destino.length > 15) {
                                        destinoLines = 2;
                                    }
                                    
                                    const estimatedContentHeight = 
                                        (lineHeight + 2) + // Descripción
                                        6 + // Línea divisoria
                                        lineHeight + // Referencia
                                        (destinoLines === 2 ? 45 : lineHeight) + // Destino (con espaciado)
                                        26 + // Peso y CBM
                                        6 + // Separador final
                                        18; // Caja X de Y
                                    
                                    // Centrar verticalmente el contenido
                                    const verticalOffset = Math.max(0, (textBlockHeight - estimatedContentHeight) / 2);
                                    let yInfo = textBlockTop + verticalOffset;
                                    
                                    // Centrar horizontalmente agregando margen
                                    const horizontalMargin = Math.max(0, (leftWidth - Math.min(leftWidth, 150)) / 2);
                                    const centeredLeftX = leftX + horizontalMargin;
                                    const centeredWidth = leftWidth - (horizontalMargin * 2);

                                    // Descripción del producto (destacada)
                                    let descripcion = (parsedData.descripcion || '').trim();
                                    if (descripcion.length > 60) descripcion = descripcion.slice(0, 57) + '…';
                                    doc.fontSize(fontSizeDesc).font('Helvetica-Bold').fillColor(colorAccent)
                                        .text(descripcion || 'Sin descripción', centeredLeftX, yInfo, {
                                            width: centeredWidth,
                                            align: 'center',
                                            lineBreak: false
                                        });
                                    yInfo += lineHeight + 2;

                                    // Línea divisoria sutil
                                    doc.save();
                                    doc.strokeColor('#e0e0e0').lineWidth(0.5)
                                       .moveTo(centeredLeftX, yInfo).lineTo(centeredLeftX + centeredWidth * 0.8, yInfo).stroke();
                                    doc.restore();
                                    yInfo += 6;

                                    // Referencia con estilo de etiqueta-valor
                                    doc.fontSize(fontSizeLabel).font('Helvetica').fillColor(colorLabel)
                                        .text('REF:', centeredLeftX, yInfo, {
                                            width: 30,
                                            align: 'left',
                                            lineBreak: false
                                        });
                                    doc.fontSize(fontSizeValue).font('Helvetica-Bold').fillColor(colorValue)
                                        .text(parsedData.ref_art || '-', centeredLeftX + 32, yInfo, {
                                            width: centeredWidth - 32,
                                            align: 'left',
                                            lineBreak: false
                                        });
                                    yInfo += lineHeight;

                                    // Destino con mejor manejo de texto largo
                                    doc.fontSize(fontSizeLabel).font('Helvetica').fillColor(colorLabel)
                                        .text('DEST:', centeredLeftX, yInfo, {
                                            width: 30,
                                            align: 'left',
                                            lineBreak: false
                                        });
                                    
                                    console.log(`🔍 Destino: "${destino}" | Ancho: ${destinoWidth} | Disponible: ${availableWidth} | Longitud: ${destino.length}`);
                                    
                                    // Si el destino es muy largo para una línea, dividirlo en dos
                                    if (destinoWidth > availableWidth || destino.length > 15) {
                                        const words = destino.split(' ');
                                        if (words.length > 1) {
                                            console.log('📝 Dividiendo destino en dos líneas');
                                            // Dividir en dos líneas
                                            const midPoint = Math.ceil(words.length / 2);
                                            const firstLine = words.slice(0, midPoint).join(' ');
                                            const secondLine = words.slice(midPoint).join(' ');
                                            
                                            doc.fontSize(fontSizeValue).font('Helvetica').fillColor(colorValue)
                                                .text(firstLine, centeredLeftX + 32, yInfo, {
                                                    width: centeredWidth - 32,
                                                    align: 'left',
                                                    lineBreak: false
                                                });
                                            yInfo += 15; // Espaciado entre líneas del destino
                                            doc.text(secondLine, centeredLeftX + 32, yInfo, {
                                                width: centeredWidth - 32,
                                                align: 'left',
                                                lineBreak: false
                                            });
                                            yInfo += 30; // Espaciado grande después del destino de dos líneas
                                        } else {
                                            // Una sola palabra muy larga, truncar
                                            if (destino.length > 25) destino = destino.slice(0, 22) + '…';
                                            doc.fontSize(fontSizeValue).font('Helvetica').fillColor(colorValue)
                                                .text(destino, centeredLeftX + 32, yInfo, {
                                                    width: centeredWidth - 32,
                                                    align: 'left',
                                                    lineBreak: false
                                                });
                                            yInfo += lineHeight;
                                        }
                                    } else {
                                        console.log('📝 Destino en una línea');
                                        // El destino cabe en una línea
                                        doc.fontSize(fontSizeValue).font('Helvetica').fillColor(colorValue)
                                            .text(destino, centeredLeftX + 32, yInfo, {
                                                width: centeredWidth - 32,
                                                align: 'left',
                                                lineBreak: false
                                            });
                                        yInfo += lineHeight;
                                    }

                                    // Información técnica en dos columnas
                                    const colWidth = (centeredWidth - 10) / 2;
                                    
                                    // Columna izquierda - Peso
                                    doc.fontSize(fontSizeLabel).font('Helvetica').fillColor(colorLabel)
                                        .text('PESO:', centeredLeftX, yInfo, {
                                            width: colWidth,
                                            align: 'left',
                                            lineBreak: false
                                        });
                                    doc.fontSize(fontSizeValue).font('Helvetica-Bold').fillColor(colorValue)
                                        .text(`${parsedData.peso || '-'} kg`, centeredLeftX, yInfo + 10, {
                                            width: colWidth,
                                            align: 'left',
                                            lineBreak: false
                                        });

                                    // Columna derecha - CBM
                                    const colRightX = centeredLeftX + colWidth + 10;
                                    doc.fontSize(fontSizeLabel).font('Helvetica').fillColor(colorLabel)
                                        .text('CBM:', colRightX, yInfo, {
                                            width: colWidth,
                                            align: 'left',
                                            lineBreak: false
                                        });
                                    doc.fontSize(fontSizeValue).font('Helvetica-Bold').fillColor(colorValue)
                                        .text(`${parsedData.cbm || '-'} m³`, colRightX, yInfo + 10, {
                                            width: colWidth,
                                            align: 'left',
                                            lineBreak: false
                                        });
                                    yInfo += 26;

                                    // Separador final
                                    doc.save();
                                    doc.strokeColor('#e0e0e0').lineWidth(0.5)
                                       .moveTo(centeredLeftX, yInfo).lineTo(centeredLeftX + centeredWidth * 0.8, yInfo).stroke();
                                    doc.restore();
                                    yInfo += 6;

                                    // Caja X de Y estilizada con fondo - centrada
                                    const cajaText = `Caja ${parsedData.numero_caja || '-'} de ${parsedData.total_cajas || '-'}`;
                                    const cajaTextWidth = doc.widthOfString(cajaText, { fontSize: fontSizeCaja });
                                    const cajaBoxWidth = cajaTextWidth + 12;
                                    const cajaBoxHeight = 18;
                                    
                                    // Centrar la caja horizontalmente
                                    const cajaX = centeredLeftX + (centeredWidth - cajaBoxWidth) / 2;
                                    
                                    // Fondo del texto de caja
                                    doc.save();
                                    doc.roundedRect(cajaX, yInfo - 2, cajaBoxWidth, cajaBoxHeight, 3)
                                       .fillColor('#f5f5f5').fill()
                                       .strokeColor('#ddd').lineWidth(0.5).stroke();
                                    doc.restore();
                                    
                                    // Texto de caja
                                    doc.fontSize(fontSizeCaja).font('Helvetica-Bold').fillColor(colorAccent)
                                        .text(cajaText, cajaX + 6, yInfo + 2, {
                                            width: centeredWidth,
                                            align: 'left',
                                            lineBreak: false
                                        });

                                     // Footer por página: índice del QR
                                     doc.fontSize(9).fillColor('#1976d2').text(`QR ${i + 1} de ${totalQR}`, 50, doc.page.height - 70, {
                                          align: 'center',
                                          width: doc.page.width - 100
                                     });

                        } catch (qrError) {
                            console.error(`❌ Error generando QR dinámico ${i}:`, qrError);
                            doc.fontSize(10)
                               .fillColor('red')
                               .text('Error generando QR', x, yQR + qrSize/2, { 
                                   width: qrSize, 
                                   align: 'center' 
                               });
                        }
                    }
                    // Mostrar intervalo en la última página

                    // No se necesita footer adicional; cada página ya muestra su número de QR

                    doc.end();

                } catch (error) {
                    console.error(`❌ Error en creación de PDF optimizado:`, error);
                    reject(error);
                }
            });
        } catch (error) {
            console.error(`❌ Error importando PDFKit:`, error);
            throw error;
        }
    }
}

// Instancia singleton del servicio
export const qrDataService = new QRDataService();
