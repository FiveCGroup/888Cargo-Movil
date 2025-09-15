import { query, insert, get } from '../db/database.js';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import * as CajaModel from './caja.model.js';
import * as ArticuloModel from './articulo.model.js';
import * as CargaModel from './carga.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios
const QR_IMAGES_DIR = path.join(__dirname, '..', 'qr-images');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const LOGO_PATH = path.join(ASSETS_DIR, '888cargo-logo.png');

// Crear directorio si no existe
if (!fs.existsSync(QR_IMAGES_DIR)) {
    fs.mkdirSync(QR_IMAGES_DIR, { recursive: true });
}

/**
 * Modelo para la tabla qr
 * Gestiona los códigos QR asociados a las cajas
 */

// ================== FUNCIONES DE GENERACIÓN QR ==================

// Función para generar QR con logo 888Cargo
async function generateQRWithLogo(data, outputPath) {
  try {
    console.log('🎨 [QR Model] Generando QR con logo 888Cargo...');
    
    // Generar QR base en buffer
    const qrBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 512, // Tamaño más grande para mejor calidad
      errorCorrectionLevel: 'H' // Nivel alto para soportar logo
    });

    // Verificar si el logo existe
    if (!fs.existsSync(LOGO_PATH)) {
      console.warn('⚠️ [QR Model] Logo no encontrado, generando QR sin logo');
      await fs.promises.writeFile(outputPath, qrBuffer);
      return;
    }

    // Crear imagen compuesta con logo y fondo circular
    const logoSize = 80; // Tamaño del logo en el centro
    const qrSize = 512;
    const logoPosition = (qrSize - logoSize) / 2;
    const borderSize = 6; // Borde del fondo circular
    const circleRadius = (logoSize / 2) + borderSize;

    // Crear fondo circular azul (#17243f)
    const circleSize = circleRadius * 2;
    const circle = Buffer.from(
      `<svg width="${circleSize}" height="${circleSize}">
        <circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius}" fill="#17243f"/>
      </svg>`
    );

    const circleBuffer = await sharp(circle)
      .png()
      .toBuffer();

    // Redimensionar logo con fondo transparente
    const logoBuffer = await sharp(LOGO_PATH)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Combinar QR con fondo circular y logo usando Sharp
    const circlePosition = logoPosition - borderSize;
    
    await sharp(qrBuffer)
      .composite([
        {
          input: circleBuffer,
          top: Math.round(circlePosition),
          left: Math.round(circlePosition)
        },
        {
          input: logoBuffer,
          top: Math.round(logoPosition),
          left: Math.round(logoPosition)
        }
      ])
      .png()
      .toFile(outputPath);

    console.log('✅ [QR Model] QR con logo y fondo circular generado exitosamente');
  } catch (error) {
    console.error('❌ [QR Model] Error al generar QR con logo:', error);
    // Fallback: generar QR sin logo
    const qrBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      quality: 0.92,
      margin: 2,
      width: 512
    });
    await fs.promises.writeFile(outputPath, qrBuffer);
    console.log('⚠️ [QR Model] QR generado sin logo como fallback');
  }
}

// ================== OPERACIONES CRUD BÁSICAS ==================

// Crear un nuevo QR
export async function createQR(qrData) {
  const {
    id_caja,
    codigo_qr,
    tipo_qr = 'caja',
    datos_qr = '',
    estado = 'generado',
    url_imagen = null,
    formato = 'PNG',
    tamaño = 200,
    nivel_correccion = 'M'
  } = qrData;

  try {
    const result = await insert(
      `INSERT INTO qr (
        id_caja, codigo_qr, tipo_qr, datos_qr, estado, 
        url_imagen, formato, tamaño, nivel_correccion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_caja, codigo_qr, tipo_qr, datos_qr, estado, url_imagen, formato, tamaño, nivel_correccion]
    );
    
    // Obtener el QR recién creado
    const newQR = await get('SELECT * FROM qr WHERE id_qr = ?', [result.id]);
    console.log('✅ [QR Model] QR creado:', newQR.id_qr);
    return newQR;
  } catch (error) {
    console.error('❌ [QR Model] Error al crear QR:', error);
    throw error;
  }
}

// Obtener un QR por ID
export async function getQRById(id_qr) {
  try {
    const result = await get(`
      SELECT q.*, 
             c.numero_caja, c.total_cajas, c.cantidad_en_caja, c.descripcion_contenido,
             a.ref_art, a.descripcion_espanol, a.descripcion_chino,
             car.codigo_carga, car.ciudad_destino
      FROM qr q
      LEFT JOIN caja c ON q.id_caja = c.id_caja
      LEFT JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      LEFT JOIN cargas car ON a.id_carga = car.id_carga
      WHERE q.id_qr = ?
    `, [id_qr]);
    return result;
  } catch (error) {
    console.error('❌ [QR Model] Error al buscar QR por ID:', error);
    throw error;
  }
}

// Obtener QR por código
export async function getQRByCodigo(codigo_qr) {
  try {
    const result = await get('SELECT * FROM qr WHERE codigo_qr = ?', [codigo_qr]);
    return result;
  } catch (error) {
    console.error('❌ [QR Model] Error al buscar QR por código:', error);
    throw error;
  }
}

// Obtener QRs por caja
export async function getQRsByCaja(id_caja) {
  try {
    const result = await query(
      'SELECT * FROM qr WHERE id_caja = ? ORDER BY fecha_generacion DESC',
      [id_caja]
    );
    return result;
  } catch (error) {
    console.error('❌ [QR Model] Error al obtener QRs por caja:', error);
    throw error;
  }
}

// Obtener QRs por carga
export async function getQRsByCarga(id_carga) {
  try {
    const result = await query(`
      SELECT q.*, c.numero_caja, c.total_cajas, a.ref_art, a.descripcion_espanol
      FROM qr q
      INNER JOIN caja c ON q.id_caja = c.id_caja
      INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      WHERE a.id_carga = ?
      ORDER BY c.numero_caja, q.fecha_generacion DESC
    `, [id_carga]);
    return result;
  } catch (error) {
    console.error('❌ [QR Model] Error al obtener QRs por carga:', error);
    throw error;
  }
}

// Actualizar QR
export async function updateQR(id_qr, qrData) {
  try {
    // Solo actualizar campos que se proporcionan
    const setClause = [];
    const values = [];
    
    Object.keys(qrData).forEach(key => {
      setClause.push(`${key} = ?`);
      values.push(qrData[key]);
    });
    
    if (setClause.length === 0) {
      throw new Error('No hay campos para actualizar');
    }
    
    values.push(id_qr); // Para la cláusula WHERE
    
    const sql = `UPDATE qr SET ${setClause.join(', ')} WHERE id_qr = ?`;
    
    await query(sql, values);
    
    const updatedQR = await getQRById(id_qr);
    return updatedQR;
  } catch (error) {
    console.error('❌ [QR Model] Error al actualizar QR:', error);
    throw error;
  }
}

// Eliminar QR
export async function deleteQR(id_qr) {
  try {
    const qrToDelete = await getQRById(id_qr);
    
    // Eliminar archivo de imagen si existe
    if (qrToDelete && qrToDelete.url_imagen) {
      const imagePath = path.join(QR_IMAGES_DIR, path.basename(qrToDelete.url_imagen));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await query('DELETE FROM qr WHERE id_qr = ?', [id_qr]);
    return qrToDelete;
  } catch (error) {
    console.error('❌ [QR Model] Error al eliminar QR:', error);
    throw error;
  }
}

// ================== OPERACIONES ESPECIALES ==================

// Generar código único para QR
export function generarCodigoQR(id_caja) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QR-${id_caja}-${timestamp}-${random}`;
}

// Crear QR para una caja con imagen
export async function createQRForCaja(id_caja, cajaInfo = {}) {
  try {
    // Generar código único
    const codigo_qr = generarCodigoQR(id_caja);
    
    // Obtener información completa de la caja
    const caja = await CajaModel.getCajaById(id_caja);
    if (!caja) {
      throw new Error(`Caja ${id_caja} no encontrada`);
    }

    // Obtener información del artículo
    const articulo = await ArticuloModel.getArticuloById(caja.id_articulo);
    
    // Obtener información de la carga
    const carga = await CargaModel.getCargaById(articulo?.id_carga);

    // Crear datos del QR siguiendo la estructura del proyecto web
    const qrContent = {
      qr_id: null, // Se asignará después de guardar en BD
      codigo_unico: codigo_qr,
      numero_caja: caja.numero_caja || cajaInfo.numero_caja || 1,
      total_cajas: caja.total_cajas || cajaInfo.total_cajas || 1,
      codigo_carga: caja.codigo_carga || cajaInfo.codigo_carga || carga?.codigo_carga || '',
      descripcion: caja.descripcion_contenido || articulo?.descripcion_espanol || cajaInfo.descripcion_espanol || cajaInfo.descripcion_chino || '-',
      ref_art: caja.ref_art || articulo?.ref_art || cajaInfo.ref_art || '-',
      destino: carga?.direccion_destino || cajaInfo.ciudad_destino || '-',
      peso: caja.gw || articulo?.gw || '-',
      cbm: caja.cbm || articulo?.cbm || '-',
      imagen_url: articulo?.imagen_url || null,
      timestamp: new Date().toISOString(),
      version: '2.2' // Versión con destino y campos simplificados
    };

    const datos_qr = JSON.stringify(qrContent);

    // Generar imagen QR con logo
    const fileName = `qr_caja_${id_caja}_${Date.now()}.png`;
    const filePath = path.join(QR_IMAGES_DIR, fileName);
    
    // Usar nueva función con logo 888Cargo
    await generateQRWithLogo(datos_qr, filePath);

    const url_imagen = `/qr-images/${fileName}`;

    // Crear registro en base de datos
    const qrData = {
      id_caja,
      codigo_qr,
      tipo_qr: 'caja',
      datos_qr,
      estado: 'generado',
      url_imagen,
      formato: 'PNG',
      tamaño: 256,
      nivel_correccion: 'M'
    };

    const newQR = await createQR(qrData);
    
    // Actualizar el qr_id en el contenido y regenerar la imagen (como en el proyecto web)
    qrContent.qr_id = newQR.id_qr;
    const updatedDatosQR = JSON.stringify(qrContent);
    
    // Actualizar el registro con el contenido actualizado
    await updateQR(newQR.id_qr, { datos_qr: updatedDatosQR });
    
    // Regenerar imagen QR con el ID incluido
    await generateQRWithLogo(updatedDatosQR, filePath);
    
    console.log(`✅ [QR Model] QR generado para caja ${id_caja}: ${codigo_qr}`);
    
    return newQR;
  } catch (error) {
    console.error('❌ [QR Model] Error al crear QR para caja:', error);
    throw error;
  }
}

// Actualizar imagen de QR
export async function updateQRImage(id_qr, nuevaImagenPath) {
  try {
    const qr = await getQRById(id_qr);
    if (!qr) {
      throw new Error('QR no encontrado');
    }

    // Eliminar imagen anterior si existe
    if (qr.url_imagen) {
      const oldImagePath = path.join(QR_IMAGES_DIR, path.basename(qr.url_imagen));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Actualizar URL de imagen
    await query('UPDATE qr SET url_imagen = ? WHERE id_qr = ?', [nuevaImagenPath, id_qr]);
    
    const updatedQR = await getQRById(id_qr);
    return updatedQR;
  } catch (error) {
    console.error('❌ [QR Model] Error al actualizar imagen QR:', error);
    throw error;
  }
}

// Obtener estadísticas de QRs
export async function getEstadisticasQRs(id_carga) {
  try {
    const stats = await get(`
      SELECT 
        COUNT(q.id_qr) as total_qrs,
        COUNT(DISTINCT q.id_caja) as cajas_con_qr,
        SUM(CASE WHEN q.estado = 'generado' THEN 1 ELSE 0 END) as qrs_generados,
        SUM(CASE WHEN q.estado = 'escaneado' THEN 1 ELSE 0 END) as qrs_escaneados
      FROM qr q
      INNER JOIN caja c ON q.id_caja = c.id_caja
      INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      WHERE a.id_carga = ?
    `, [id_carga]);
    
    return stats;
  } catch (error) {
    console.error('❌ [QR Model] Error al obtener estadísticas de QRs:', error);
    throw error;
  }
}

export default {
  createQR,
  getQRById,
  getQRByCodigo,
  getQRsByCaja,
  getQRsByCarga,
  updateQR,
  deleteQR,
  generarCodigoQR,
  createQRForCaja,
  updateQRImage,
  getEstadisticasQRs
};