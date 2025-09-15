import * as QRModel from '../models/qr.model.js';
import * as CargaModel from '../models/carga.model.js';
import * as CajaModel from '../models/caja.model.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== CONTROLADORES QR ==================

// Obtener QRs por carga
export const obtenerQRsPorCarga = async (req, res) => {
    try {
        const { id_carga } = req.params;
        console.log(`🏷️ [QR Controller] Obteniendo QRs de carga ID: ${id_carga}`);
        
        const qrs = await QRModel.getQRsByCarga(id_carga);
        
        console.log(`✅ [QR Controller] Encontrados ${qrs.length} códigos QR`);
        
        res.json({
            success: true,
            data: qrs,
            total: qrs.length
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al obtener QRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener códigos QR',
            error: error.message
        });
    }
};

// Obtener QR por caja
export const obtenerQRPorCaja = async (req, res) => {
    try {
        const { id_caja } = req.params;
        console.log(`🏷️ [QR Controller] Obteniendo QR de caja ID: ${id_caja}`);
        
        const qr = await QRModel.getQRByCaja(id_caja);
        
        if (!qr) {
            return res.status(404).json({
                success: false,
                message: 'QR no encontrado para esta caja'
            });
        }
        
        console.log(`✅ [QR Controller] QR encontrado: ${qr.codigo_qr}`);
        
        res.json({
            success: true,
            data: qr
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al obtener QR por caja:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener QR',
            error: error.message
        });
    }
};

// Servir imagen QR (sin autenticación)
export const servirImagenQR = async (req, res) => {
    try {
        const { filename } = req.params;
        console.log(`📷 [QR Controller] Sirviendo imagen QR: ${filename}`);
        
        const imagePath = path.join(__dirname, '..', 'qr-images', filename);
        
        // Verificar que el archivo existe
        if (!fs.existsSync(imagePath)) {
            console.log(`❌ [QR Controller] Imagen QR no encontrada: ${filename}`);
            return res.status(404).json({
                success: false,
                message: 'Imagen QR no encontrada'
            });
        }
        
        // Servir archivo
        res.sendFile(imagePath);
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al servir imagen QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al servir imagen QR',
            error: error.message
        });
    }
};

// Servir imagen QR por código (sin autenticación)
export const servirImagenQRPorCodigo = async (req, res) => {
    try {
        const { codigoQR } = req.params;
        console.log(`📷 [QR Controller] Sirviendo imagen QR por código: ${codigoQR}`);
        
        // Buscar el QR en la base de datos para obtener la ruta de la imagen
        const qrData = await QRModel.getQRByCodigo(codigoQR);
        
        if (!qrData) {
            console.log(`❌ [QR Controller] Código QR no encontrado: ${codigoQR}`);
            return res.status(404).json({
                success: false,
                message: 'Código QR no encontrado'
            });
        }
        
        // Obtener la ruta de la imagen desde la base de datos
        let imagePath;
        if (qrData.url_imagen) {
            // Si hay una URL de imagen específica
            const filename = path.basename(qrData.url_imagen);
            imagePath = path.join(__dirname, '..', 'qr-images', filename);
        } else {
            // Generar nombre de archivo basado en el patrón usado
            const filename = `qr_caja_${qrData.id_caja}_*.png`;
            const qrImagesDir = path.join(__dirname, '..', 'qr-images');
            
            // Buscar archivo que coincida con el patrón
            const files = fs.readdirSync(qrImagesDir);
            const matchingFile = files.find(file => 
                file.startsWith(`qr_caja_${qrData.id_caja}_`) && file.endsWith('.png')
            );
            
            if (!matchingFile) {
                console.log(`❌ [QR Controller] Imagen QR no encontrada para caja: ${qrData.id_caja}`);
                return res.status(404).json({
                    success: false,
                    message: 'Imagen QR no encontrada'
                });
            }
            
            imagePath = path.join(qrImagesDir, matchingFile);
        }
        
        // Verificar que el archivo existe
        if (!fs.existsSync(imagePath)) {
            console.log(`❌ [QR Controller] Imagen QR no encontrada en: ${imagePath}`);
            return res.status(404).json({
                success: false,
                message: 'Imagen QR no encontrada'
            });
        }
        
        console.log(`✅ [QR Controller] Sirviendo imagen QR: ${path.basename(imagePath)}`);
        res.sendFile(imagePath);
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al servir imagen QR por código:', error);
        res.status(500).json({
            success: false,
            message: 'Error al servir imagen QR',
            error: error.message
        });
    }
};

// Obtener estadísticas de QRs
export const obtenerEstadisticasQR = async (req, res) => {
    try {
        const { id_carga } = req.params;
        console.log(`📊 [QR Controller] Obteniendo estadísticas QR de carga: ${id_carga}`);
        
        const estadisticas = await QRModel.getEstadisticasQRs(id_carga);
        
        console.log(`✅ [QR Controller] Estadísticas QR obtenidas`);
        
        res.json({
            success: true,
            data: estadisticas
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al obtener estadísticas QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas QR',
            error: error.message
        });
    }
};

// Regenerar QR para caja
export const regenerarQRCaja = async (req, res) => {
    try {
        const { id_caja } = req.params;
        console.log(`🔄 [QR Controller] Regenerando QR para caja: ${id_caja}`);
        
        // Obtener información de la caja
        const caja = await CajaModel.getCajaById(id_caja);
        if (!caja) {
            return res.status(404).json({
                success: false,
                message: 'Caja no encontrada'
            });
        }
        
        // Eliminar QR anterior si existe
        const qrAnterior = await QRModel.getQRByCaja(id_caja);
        if (qrAnterior) {
            await QRModel.deleteQR(qrAnterior.id_qr);
        }
        
        // Crear nuevo QR
        const cajaInfo = {
            numero_caja: caja.numero_caja,
            cant_por_caja: caja.cant_por_caja,
            ref_art: caja.ref_art || '',
            descripcion_espanol: caja.descripcion_espanol || '',
            descripcion_chino: caja.descripcion_chino || '',
            codigo_carga: caja.codigo_carga || '',
            ciudad_destino: caja.ciudad_destino || ''
        };
        
        const nuevoQR = await QRModel.createQRForCaja(id_caja, cajaInfo);
        
        console.log(`✅ [QR Controller] QR regenerado: ${nuevoQR.codigo_qr}`);
        
        res.json({
            success: true,
            data: nuevoQR,
            message: 'QR regenerado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al regenerar QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al regenerar QR',
            error: error.message
        });
    }
};

// Validar QR escaneado
export const validarQREscaneado = async (req, res) => {
    try {
        const { codigo_qr } = req.body;
        console.log(`🔍 [QR Controller] Validando QR escaneado: ${codigo_qr}`);
        
        if (!codigo_qr) {
            return res.status(400).json({
                success: false,
                message: 'Código QR requerido'
            });
        }
        
        // Buscar QR en base de datos
        const qr = await QRModel.getQRByCodigo(codigo_qr);
        
        if (!qr) {
            return res.status(404).json({
                success: false,
                message: 'QR no válido o no encontrado'
            });
        }
        
        // Obtener información completa de la caja y carga
        const caja = await CajaModel.getCajaById(qr.id_caja);
        const carga = caja ? await CargaModel.getCargaById(caja.id_articulo) : null;
        
        console.log(`✅ [QR Controller] QR válido encontrado`);
        
        res.json({
            success: true,
            data: {
                qr,
                caja,
                carga,
                valido: true,
                fecha_validacion: new Date().toISOString()
            },
            message: 'QR válido'
        });
        
    } catch (error) {
        console.error('❌ [QR Controller] Error al validar QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar QR',
            error: error.message
        });
    }
};