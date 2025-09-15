import QRCode from 'qrcode';
import { initDatabase } from '../db/database.js';

// Obtener datos QR de una carga
export const obtenerQRDataDeCarga = async (req, res) => {
    try {
        const { idCarga } = req.params;
        console.log(`🏷️ [QR Controller] Obteniendo QRs de carga ID: ${idCarga}`);
        
        const db = await initDatabase();
        
        const query = `
            SELECT 
                id,
                item_numero,
                descripcion,
                qr_code
            FROM packing_list_items
            WHERE id_carga = ?
            ORDER BY item_numero ASC
        `;
        
        const qrData = db.prepare(query).all(idCarga);
        
        console.log(`🏷️ [QR Controller] Encontrados ${qrData.length} códigos QR`);
        
        res.json({
            success: true,
            data: qrData
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al obtener QR data:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener códigos QR',
            error: error.message
        });
    }
};

// Generar imagen QR dinámica
export const obtenerImagenQR = async (req, res) => {
    try {
        const { qrCode } = req.params;
        const { size = 200 } = req.query;
        
        console.log(`📷 [QR Controller] Generando imagen QR (tamaño: ${size}px)`);
        
        // Generar imagen QR
        const qrOptions = {
            type: 'png',
            quality: 0.92,
            width: parseInt(size),
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        };
        
        const qrBuffer = await QRCode.toBuffer(qrCode, qrOptions);
        
        // Enviar imagen
        res.set({
            'Content-Type': 'image/png',
            'Content-Length': qrBuffer.length,
            'Cache-Control': 'public, max-age=31557600' // Cache por 1 año
        });
        
        res.send(qrBuffer);
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al generar imagen QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar imagen QR',
            error: error.message
        });
    }
};

// Generar QR data para una carga (si no existen)
export const generarQRDataParaCarga = async (req, res) => {
    try {
        const { idCarga } = req.params;
        console.log(`🔄 [QR Controller] Generando QRs para carga ID: ${idCarga}`);
        
        const db = await initDatabase();
        
        // Verificar si ya existen QRs
        const existentes = db.prepare(`
            SELECT COUNT(*) as count 
            FROM packing_list_items 
            WHERE id_carga = ? AND qr_code IS NOT NULL AND qr_code != ''
        `).get(idCarga);
        
        if (existentes.count > 0) {
            return res.json({
                success: true,
                message: 'Los códigos QR ya existen para esta carga',
                data: { qrs_existentes: existentes.count }
            });
        }
        
        // Obtener información de la carga
        const cargaInfo = db.prepare(`
            SELECT c.codigo_carga, c.total_items
            FROM cargas c
            WHERE c.id = ?
        `).get(idCarga);
        
        if (!cargaInfo) {
            return res.status(404).json({
                success: false,
                message: 'Carga no encontrada'
            });
        }
        
        // Obtener items sin QR
        const items = db.prepare(`
            SELECT id, item_numero, descripcion
            FROM packing_list_items
            WHERE id_carga = ?
            ORDER BY item_numero ASC
        `).all(idCarga);
        
        // Generar QRs para cada item
        const updateItem = db.prepare(`
            UPDATE packing_list_items 
            SET qr_code = ?
            WHERE id = ?
        `);
        
        let qrsGenerados = 0;
        
        for (const item of items) {
            const qrData = {
                carga: cargaInfo.codigo_carga,
                item: item.item_numero,
                descripcion: item.descripcion,
                timestamp: Date.now()
            };
            
            const qrCode = JSON.stringify(qrData);
            
            try {
                updateItem.run(qrCode, item.id);
                qrsGenerados++;
            } catch (error) {
                console.error(`❌ Error al actualizar QR para item ${item.item_numero}:`, error);
            }
        }
        
        console.log(`✅ [QR Controller] ${qrsGenerados} QRs generados`);
        
        res.json({
            success: true,
            message: `${qrsGenerados} códigos QR generados correctamente`,
            data: {
                qrs_generados: qrsGenerados,
                total_items: items.length
            }
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al generar QRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar códigos QR',
            error: error.message
        });
    }
};

// Validar QR escaneado
export const validarQREscaneado = async (req, res) => {
    try {
        const { qrData } = req.body;
        console.log(`🔍 [QR Controller] Validando QR escaneado`);
        
        if (!qrData) {
            return res.status(400).json({
                success: false,
                message: 'Datos QR requeridos'
            });
        }
        
        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Formato de QR inválido'
            });
        }
        
        const db = await initDatabase();
        
        // Buscar el item por código QR
        const query = `
            SELECT 
                pli.id,
                pli.item_numero,
                pli.descripcion,
                pli.cantidad,
                pli.peso,
                pli.medidas,
                pli.valor,
                c.codigo_carga,
                c.direccion_destino,
                cl.nombre_cliente
            FROM packing_list_items pli
            JOIN cargas c ON pli.id_carga = c.id
            JOIN clientes cl ON c.id_cliente = cl.id
            WHERE pli.qr_code = ?
        `;
        
        const item = db.prepare(query).get(qrData);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Código QR no encontrado en el sistema'
            });
        }
        
        console.log(`✅ [QR Controller] QR válido para item: ${item.descripcion}`);
        
        res.json({
            success: true,
            message: 'Código QR válido',
            data: {
                item: item,
                qr_data: parsedData,
                validado_en: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al validar QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar código QR',
            error: error.message
        });
    }
};
