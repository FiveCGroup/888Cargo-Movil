import { query, run, get } from '../db.js';

/**
 * Modelo para la tabla qr
 * Gestiona los códigos QR asociados a las cajas
 */

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
    const result = await run(
      `INSERT INTO qr (
        id_caja, codigo_qr, tipo_qr, datos_qr, estado, 
        url_imagen, formato, tamaño, nivel_correccion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_caja, codigo_qr, tipo_qr, datos_qr, estado, url_imagen, formato, tamaño, nivel_correccion]
    );
    
    // Obtener el QR recién creado
    const newQR = await get('SELECT * FROM qr WHERE id_qr = ?', [result.id]);
    return newQR;
  } catch (error) {
    console.error('Error al crear QR:', error);
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
             cl.nombre_cliente, cl.correo_cliente,
             car.codigo_carga, car.ciudad_destino
      FROM qr q
      LEFT JOIN caja c ON q.id_caja = c.id_caja
      LEFT JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      LEFT JOIN carga car ON a.id_carga = car.id_carga
      LEFT JOIN cliente cl ON car.id_cliente = cl.id_cliente
      WHERE q.id_qr = ?
    `, [id_qr]);
    return result;
  } catch (error) {
    console.error('Error al buscar QR por ID:', error);
    throw error;
  }
}

// Obtener un QR por código
export async function getQRByCodigo(codigo_qr) {
  try {
    const result = await get(`
      SELECT q.*, 
             c.numero_caja, c.total_cajas, c.cantidad_en_caja, c.descripcion_contenido,
             a.ref_art, a.descripcion_espanol, a.descripcion_chino,
             cl.nombre_cliente, cl.correo_cliente,
             car.codigo_carga, car.ciudad_destino
      FROM qr q
      LEFT JOIN caja c ON q.id_caja = c.id_caja
      LEFT JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      LEFT JOIN carga car ON a.id_carga = car.id_carga
      LEFT JOIN cliente cl ON car.id_cliente = cl.id_cliente
      WHERE q.codigo_qr = ?
    `, [codigo_qr]);
    return result;
  } catch (error) {
    console.error('Error al buscar QR por código:', error);
    throw error;
  }
}

// Obtener todos los QR de una caja
export async function getQRsByCaja(id_caja) {
  try {
    const result = await query(
      'SELECT * FROM qr WHERE id_caja = ? ORDER BY fecha_generacion DESC',
      [id_caja]
    );
    return result;
  } catch (error) {
    console.error('Error al obtener QRs por caja:', error);
    throw error;
  }
}

// Obtener todos los QR de una carga
export async function getQRsByCarga(id_carga) {
  try {
    const result = await query(`
      SELECT q.*, 
             c.numero_caja, c.total_cajas, c.cantidad_en_caja,
             a.ref_art, a.descripcion_espanol
      FROM qr q
      INNER JOIN caja c ON q.id_caja = c.id_caja
      INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      WHERE a.id_carga = ?
      ORDER BY c.numero_caja, q.fecha_generacion DESC
    `, [id_carga]);
    return result;
  } catch (error) {
    console.error('Error al obtener QRs por carga:', error);
    throw error;
  }
}

// Actualizar un QR
export async function updateQR(id_qr, qrData) {
  const {
    codigo_qr,
    tipo_qr,
    datos_qr,
    estado,
    url_imagen,
    formato,
    tamaño,
    nivel_correccion
  } = qrData;

  try {
    await run(
      `UPDATE qr SET 
        codigo_qr = ?, tipo_qr = ?, datos_qr = ?, estado = ?,
        url_imagen = ?, formato = ?, tamaño = ?, nivel_correccion = ?
       WHERE id_qr = ?`,
      [codigo_qr, tipo_qr, datos_qr, estado, url_imagen, formato, tamaño, nivel_correccion, id_qr]
    );
    
    // Obtener el QR actualizado
    const updatedQR = await getQRById(id_qr);
    return updatedQR;
  } catch (error) {
    console.error('Error al actualizar QR:', error);
    throw error;
  }
}

// Marcar QR como impreso
export async function marcarQRComoImpreso(id_qr) {
  try {
    await run(
      `UPDATE qr SET 
        estado = 'impreso',
        fecha_impresion = CURRENT_TIMESTAMP
       WHERE id_qr = ?`,
      [id_qr]
    );
    
    const updatedQR = await getQRById(id_qr);
    return updatedQR;
  } catch (error) {
    console.error('Error al marcar QR como impreso:', error);
    throw error;
  }
}

// Eliminar un QR
export async function deleteQR(id_qr) {
  try {
    const qrToDelete = await getQRById(id_qr);
    await run('DELETE FROM qr WHERE id_qr = ?', [id_qr]);
    return qrToDelete;
  } catch (error) {
    console.error('Error al eliminar QR:', error);
    throw error;
  }
}

// ================== OPERACIONES ESPECIALES ==================

// Generar código QR único
export function generarCodigoQR(id_caja, numero_caja, total_cajas) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `QR-${id_caja}-${numero_caja}-${total_cajas}-${timestamp}-${random}`;
}

// Crear datos estructurados del QR
export function crearDatosQR(cajaInfo) {
  const {
    numero_caja,
    total_cajas,
    cantidad_en_caja,
    nombre_cliente,
    ref_art,
    descripcion_espanol,
    codigo_carga,
    id_caja
  } = cajaInfo;

  const datos = {
    id_caja,
    numero_caja,
    total_cajas,
    cantidad_items: cantidad_en_caja,
    cliente: nombre_cliente,
    item: ref_art,
    descripcion: descripcion_espanol,
    carga: codigo_carga,
    fecha_generacion: new Date().toISOString()
  };

  return JSON.stringify(datos);
}

// Crear QR para una caja específica
export async function createQRForCaja(id_caja) {
  try {
    // Obtener información completa de la caja
    const cajaInfo = await query(`
      SELECT c.*, 
             a.ref_art, a.descripcion_espanol,
             cl.nombre_cliente,
             car.codigo_carga
      FROM caja c
      LEFT JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      LEFT JOIN carga car ON a.id_carga = car.id_carga
      LEFT JOIN cliente cl ON car.id_cliente = cl.id_cliente
      WHERE c.id_caja = ?
    `, [id_caja]);

    if (!cajaInfo || cajaInfo.length === 0) {
      throw new Error('Caja no encontrada');
    }

    const caja = cajaInfo[0];
    
    // Generar código QR único
    const codigo_qr = generarCodigoQR(id_caja, caja.numero_caja, caja.total_cajas);
    
    // Crear datos estructurados
    const datos_qr = crearDatosQR(caja);
    
    // Crear registro QR
    const qrData = {
      id_caja,
      codigo_qr,
      tipo_qr: 'caja',
      datos_qr,
      estado: 'generado'
    };
    
    const newQR = await createQR(qrData);
    return newQR;
  } catch (error) {
    console.error('Error al crear QR para caja:', error);
    throw error;
  }
}

// Crear QRs para todas las cajas de una carga
export async function createQRsForCarga(id_carga) {
  try {
    // Obtener todas las cajas de la carga
    const cajas = await query(`
      SELECT c.id_caja
      FROM caja c
      INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      WHERE a.id_carga = ?
      ORDER BY c.numero_caja
    `, [id_carga]);

    const qrsCreados = [];
    
    for (const caja of cajas) {
      // Verificar si ya existe un QR para esta caja
      const qrExistente = await query('SELECT id_qr FROM qr WHERE id_caja = ?', [caja.id_caja]);
      
      if (qrExistente.length === 0) {
        const qr = await createQRForCaja(caja.id_caja);
        qrsCreados.push(qr);
      }
    }
    
    return qrsCreados;
  } catch (error) {
    console.error('Error al crear QRs para carga:', error);
    throw error;
  }
}

// Obtener estadísticas de QRs
export async function getEstadisticasQRs(id_carga = null) {
  try {
    let whereClause = '';
    let params = [];
    
    if (id_carga) {
      whereClause = `WHERE a.id_carga = ?`;
      params = [id_carga];
    }
    
    const stats = await get(`
      SELECT 
        COUNT(q.id_qr) as total_qrs,
        COUNT(CASE WHEN q.estado = 'generado' THEN 1 END) as qrs_generados,
        COUNT(CASE WHEN q.estado = 'impreso' THEN 1 END) as qrs_impresos,
        COUNT(DISTINCT q.id_caja) as cajas_con_qr
      FROM qr q
      INNER JOIN caja c ON q.id_caja = c.id_caja
      INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      ${whereClause}
    `, params);
    
    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas de QRs:', error);
    throw error;
  }
}

// Validar código QR
export async function validarCodigoQR(codigo_qr) {
  try {
    const qr = await getQRByCodigo(codigo_qr);
    
    if (!qr) {
      return { valido: false, error: 'Código QR no encontrado' };
    }
    
    // Parsear datos del QR
    let datosParseados = null;
    try {
      datosParseados = JSON.parse(qr.datos_qr);
    } catch (e) {
      datosParseados = qr.datos_qr;
    }
    
    return {
      valido: true,
      qr,
      datos: datosParseados,
      informacion: {
        caja: `${qr.numero_caja} de ${qr.total_cajas}`,
        cliente: qr.nombre_cliente,
        item: qr.ref_art,
        descripcion: qr.descripcion_espanol,
        cantidad: qr.cantidad_en_caja,
        carga: qr.codigo_carga
      }
    };
  } catch (error) {
    console.error('Error al validar código QR:', error);
    return { valido: false, error: 'Error al procesar el código QR' };
  }
}

// Actualizar la URL de imagen de un QR
export async function updateQRImage(id_qr, url_imagen) {
  try {
    await run(
      'UPDATE qr SET url_imagen = ? WHERE id_qr = ?',
      [url_imagen, id_qr]
    );
    
    return await get('SELECT * FROM qr WHERE id_qr = ?', [id_qr]);
  } catch (error) {
    console.error('Error al actualizar imagen QR:', error);
    throw error;
  }
}
