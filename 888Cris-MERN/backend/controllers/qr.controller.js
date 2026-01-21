// controllers/qr.controller.js
import {
  validarEscaneoQR,
  generarPDFParaCarga
} from '../services/qr.service.js';
import databaseRepository from '../repositories/index.js';
import { generateQRWithLogo } from '../utils/qrLogoGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { access } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, '../assets/888cargo-logo.png');

export const validarEscaneo = async (req, res) => {
  try {
    const { codigoQR } = req.body;
    const result = await validarEscaneoQR(codigoQR, req.user?.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const generarPDFCarga = async (req, res) => {
  try {
    const { cargaId } = req.params;
    const pdfBuffer = await generarPDFParaCarga(cargaId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="QR_Carga_${cargaId}.pdf"`
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Debug: Obtener QRs de una carga (formato esperado por cliente móvil)
export const obtenerQRsParaCargaDebug = async (req, res) => {
  try {
    const { id } = req.params;
    const cargaId = Number(id);
    if (!cargaId) return res.status(400).json({ success: false, message: 'ID inválido' });

    // Obtener información completa de la carga con cliente
    const cargaInfo = await databaseRepository.cargas.findOne({ id_carga: cargaId });
    if (!cargaInfo) {
      return res.status(404).json({ success: false, message: 'Carga no encontrada' });
    }

    // Obtener información del cliente
    let clienteInfo = null;
    if (cargaInfo.id_cliente) {
      clienteInfo = await databaseRepository.clientes.findOne({ id_cliente: cargaInfo.id_cliente });
    }

    // Obtener QRs con información completa de cajas y artículos
    const qrs = await databaseRepository.qr.executeQuery(`
      SELECT 
        q.*, 
        c.numero_caja, 
        c.total_cajas, 
        c.cantidad_en_caja,
        c.gw as peso_caja,
        c.cbm as volumen_caja,
        a.ref_art, 
        a.descripcion_espanol, 
        a.descripcion_chino,
        a.id_articulo,
        a.gw as peso_articulo,
        a.cbm as volumen_articulo,
        carga.codigo_carga,
        carga.destino,
        carga.shipping_mark,
        carga.estado,
        carga.ubicacion_actual
      FROM qr q
      JOIN caja c ON q.id_caja = c.id_caja
      JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      JOIN carga ON a.id_carga = carga.id_carga
      WHERE carga.id_carga = ?
      ORDER BY a.id_articulo, c.numero_caja
    `, [cargaId]);

    // Parsear datos_qr de cada QR
    const qrsConDatos = qrs.map(qr => {
      let parsedData = null;
      try {
        parsedData = qr.datos_qr ? JSON.parse(qr.datos_qr) : null;
      } catch (e) {
        console.warn(`⚠️ Error parseando datos_qr del QR ${qr.id_qr}:`, e.message);
      }

      return {
        ...qr,
        parsed_data: parsedData
      };
    });

    return res.json({ 
      success: true, 
      data: { 
        carga: {
          id: cargaId,
          codigo_carga: cargaInfo.codigo_carga,
          destino: cargaInfo.destino,
          shipping_mark: cargaInfo.shipping_mark,
          estado: cargaInfo.estado,
          ubicacion_actual: cargaInfo.ubicacion_actual,
          fecha_recepcion: cargaInfo.fecha_recepcion,
          fecha_envio: cargaInfo.fecha_envio,
          fecha_arribo: cargaInfo.fecha_arribo,
          contenedor_asociado: cargaInfo.contenedor_asociado,
          observaciones: cargaInfo.observaciones,
          gw_total: cargaInfo.gw_total,
          cbm_total: cargaInfo.cbm_total,
          total_cajas: cargaInfo.total_cajas
        },
        cliente: clienteInfo ? {
          id_cliente: clienteInfo.id_cliente,
          nombre_cliente: clienteInfo.nombre_cliente,
          correo_cliente: clienteInfo.correo_cliente,
          telefono_cliente: clienteInfo.telefono_cliente,
          ciudad_cliente: clienteInfo.ciudad_cliente,
          pais_cliente: clienteInfo.pais_cliente,
          cliente_shippingMark: clienteInfo.cliente_shippingMark,
          direccion_entrega: clienteInfo.direccion_entrega
        } : null,
        qrs: qrsConDatos,
        total_qrs: qrsConDatos.length
      } 
    });
  } catch (error) {
    console.error('Error obteniendo QRs debug:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener imagen PNG del QR por id_qr (genera on-the-fly)
export const obtenerImagenQR = async (req, res) => {
  try {
    const { id } = req.params;
    const width = parseInt(req.query.width, 10) || 300;
    const margin = parseInt(req.query.margin, 10) || 2;
    
    console.log(`🔍 [QR Image] Solicitando imagen QR para id: ${id}, width: ${width}, margin: ${margin}`);
    
    if (!id) {
      console.error('❌ [QR Image] ID inválido recibido');
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const rows = await databaseRepository.qr.executeQuery('SELECT * FROM qr WHERE id_qr = ?', [id]);
    const qrRow = rows && rows.length ? rows[0] : null;
    
    if (!qrRow) {
      console.error(`❌ [QR Image] QR ${id} no encontrado en la base de datos`);
      return res.status(404).json({ success: false, message: 'QR no encontrado' });
    }

    console.log(`✅ [QR Image] QR encontrado:`, {
      id_qr: qrRow.id_qr,
      codigo_qr: qrRow.codigo_qr,
      tiene_datos_qr: !!qrRow.datos_qr,
      tipo_datos_qr: typeof qrRow.datos_qr
    });

    // IMPORTANTE: Los QR codes tienen un límite de capacidad (~3000 caracteres máximo)
    // No podemos poner todo el JSON completo en el QR, solo un identificador
    // Los datos completos permanecen en la base de datos y se consultan usando el código
    
    // Usar solo el codigo_qr como identificador para el QR
    // Este código es suficiente para buscar los datos completos en la BD
    let datosQR = null;
    
    if (qrRow.codigo_qr) {
      datosQR = qrRow.codigo_qr;
    } else {
      // Si no hay codigo_qr, crear uno básico
      datosQR = `QR-${qrRow.id_qr}`;
    }

    // Validar que el código no sea demasiado largo para un QR (máximo ~3000 caracteres)
    const MAX_QR_LENGTH = 2500; // Dejamos margen de seguridad
    if (datosQR.length > MAX_QR_LENGTH) {
      console.warn(`⚠️ [QR Image] Código QR demasiado largo (${datosQR.length} chars), usando solo ID`);
      datosQR = `QR-${qrRow.id_qr}`;
    }

    console.log(`📝 [QR Image] Usando código para QR (solo identificador, no JSON completo): ${datosQR.substring(0, 100)}... (${datosQR.length} chars)`);
    
    // NOTA: El JSON completo con todos los datos está en qrRow.datos_qr en la BD
    // pero NO lo ponemos en el QR porque es demasiado grande
    // Cuando se escanee el QR, se usará este código para buscar los datos completos

    // Verificar si el logo existe antes de intentar usarlo
    let logoPathFinal = null;
    try {
      await access(logoPath);
      logoPathFinal = logoPath;
    } catch (e) {
      console.warn(`⚠️ Logo no encontrado en ${logoPath}, generando QR sin logo`);
      logoPathFinal = null;
    }

    // Generar el QR con las opciones correctas
    console.log(`🔄 [QR Image] Generando imagen QR con datos:`, {
      datosQR_length: datosQR?.length,
      logoPath: logoPathFinal,
      width,
      margin
    });
    
    const buffer = await generateQRWithLogo(datosQR, logoPathFinal, { 
      width,
      margin 
    });
    
    console.log(`✅ [QR Image] Imagen QR generada exitosamente, tamaño buffer: ${buffer?.length} bytes`);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error('❌ [QR Image] Error generando imagen QR:', error);
    console.error('❌ [QR Image] Stack:', error.stack);
    console.error('❌ [QR Image] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Enviar respuesta de error más informativa
    res.status(500);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ 
        success: false, 
        message: 'Error generando imagen QR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      // Si esperan una imagen, enviar un mensaje de texto
      res.setHeader('Content-Type', 'text/plain');
      return res.send(`Error generando imagen QR: ${error.message}`);
    }
  }
};