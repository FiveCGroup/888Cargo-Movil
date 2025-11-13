import { query, run, get } from '../db.js';

/**
 * Modelo para la tabla caja
 * Gestiona las cajas del packing list con información de QR
 */

// ================== OPERACIONES CRUD BÁSICAS ==================

// Crear una nueva caja
export async function createCaja(cajaData) {
  const {
    id_articulo,
    numero_caja,
    total_cajas,
    cantidad_en_caja = 0,
    cbm = 0,
    gw = 0,
    descripcion_contenido = '',
    observaciones = ''
  } = cajaData;

  try {
    const result = await run(
      `INSERT INTO caja (
        id_articulo, numero_caja, total_cajas, cantidad_en_caja, 
        cbm, gw, descripcion_contenido, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_articulo, numero_caja, total_cajas, cantidad_en_caja, cbm, gw, descripcion_contenido, observaciones]
    );
    
    // Obtener la caja recién creada
    const newCaja = await get('SELECT * FROM caja WHERE id_caja = ?', [result.id]);
    return newCaja;
  } catch (error) {
    console.error('Error al crear caja:', error);
    throw error;
  }
}

// Obtener una caja por ID
export async function getCajaById(id_caja) {
  try {
    const result = await get(`
      SELECT c.*, 
             a.ref_art, a.descripcion_espanol, a.descripcion_chino,
             cl.nombre_cliente, cl.correo_cliente,
             car.codigo_carga, car.ciudad_destino
      FROM caja c
      LEFT JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      LEFT JOIN carga car ON a.id_carga = car.id_carga
      LEFT JOIN cliente cl ON car.id_cliente = cl.id_cliente
      WHERE c.id_caja = ?
    `, [id_caja]);
    return result;
  } catch (error) {
    console.error('Error al buscar caja por ID:', error);
    throw error;
  }
}

// Obtener todas las cajas de un artículo
export async function getCajasByArticulo(id_articulo) {
  try {
    const result = await query(
      'SELECT * FROM caja WHERE id_articulo = ? ORDER BY numero_caja',
      [id_articulo]
    );
    return result;
  } catch (error) {
    console.error('Error al obtener cajas por artículo:', error);
    throw error;
  }
}

// Obtener todas las cajas de una carga
export async function getCajasByCarga(id_carga) {
  try {
    const result = await query(`
      SELECT c.*, a.ref_art, a.descripcion_espanol, a.descripcion_chino
      FROM caja c
      INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      WHERE a.id_carga = ?
      ORDER BY c.numero_caja
    `, [id_carga]);
    return result;
  } catch (error) {
    console.error('Error al obtener cajas por carga:', error);
    throw error;
  }
}

// Actualizar una caja
export async function updateCaja(id_caja, cajaData) {
  const {
    numero_caja,
    total_cajas,
    cantidad_en_caja,
    cbm,
    gw,
    descripcion_contenido,
    observaciones
  } = cajaData;

  try {
    await run(
      `UPDATE caja SET 
        numero_caja = ?, total_cajas = ?, cantidad_en_caja = ?, 
        cbm = ?, gw = ?, descripcion_contenido = ?, observaciones = ?
       WHERE id_caja = ?`,
      [numero_caja, total_cajas, cantidad_en_caja, cbm, gw, descripcion_contenido, observaciones, id_caja]
    );
    
    // Obtener la caja actualizada
    const updatedCaja = await getCajaById(id_caja);
    return updatedCaja;
  } catch (error) {
    console.error('Error al actualizar caja:', error);
    throw error;
  }
}

// Eliminar una caja
export async function deleteCaja(id_caja) {
  try {
    const cajaToDelete = await getCajaById(id_caja);
    
    // Primero eliminar los QR relacionados
    await run('DELETE FROM qr WHERE id_caja = ?', [id_caja]);
    
    // Luego eliminar la caja
    await run('DELETE FROM caja WHERE id_caja = ?', [id_caja]);
    return cajaToDelete;
  } catch (error) {
    console.error('Error al eliminar caja:', error);
    throw error;
  }
}

// ================== OPERACIONES ESPECIALES ==================

// Crear múltiples cajas para un artículo
export async function createCajasForArticulo(id_articulo, totalCajas, distribucionData = []) {
  try {
    const cajasCreadas = [];
    
    for (let i = 1; i <= totalCajas; i++) {
      const distribucion = distribucionData[i - 1] || {};
      
      const cajaData = {
        id_articulo,
        numero_caja: i,
        total_cajas: totalCajas,
        cantidad_en_caja: distribucion.cantidad || 0,
        cbm: distribucion.cbm || 0,
        gw: distribucion.gw || 0,
        descripcion_contenido: distribucion.descripcion || '',
        observaciones: distribucion.observaciones || ''
      };
      
      const caja = await createCaja(cajaData);
      cajasCreadas.push(caja);
    }
    
    return cajasCreadas;
  } catch (error) {
    console.error('Error al crear cajas para artículo:', error);
    throw error;
  }
}

// Obtener estadísticas de cajas por carga
export async function getEstadisticasCajas(id_carga) {
  try {
    const stats = await get(`
      SELECT 
        COUNT(c.id_caja) as total_cajas,
        COUNT(DISTINCT c.id_articulo) as articulos_con_cajas,
        SUM(c.cantidad_en_caja) as total_items_en_cajas,
        SUM(c.cbm) as total_cbm_cajas,
        SUM(c.gw) as total_peso_cajas,
        AVG(c.cantidad_en_caja) as promedio_items_por_caja
      FROM caja c
      INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
      WHERE a.id_carga = ?
    `, [id_carga]);
    
    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas de cajas:', error);
    throw error;
  }
}

// Validar numeración de cajas
export async function validarNumeracionCajas(id_articulo) {
  try {
    const cajas = await getCajasByArticulo(id_articulo);
    
    if (cajas.length === 0) return { valida: true, errores: [] };
    
    const errores = [];
    const totalEsperado = cajas[0].total_cajas;
    
    // Verificar que todas las cajas tengan el mismo total
    const totalesIncorrectos = cajas.filter(c => c.total_cajas !== totalEsperado);
    if (totalesIncorrectos.length > 0) {
      errores.push(`Cajas con total incorrecto: ${totalesIncorrectos.map(c => c.numero_caja).join(', ')}`);
    }
    
    // Verificar secuencia de números
    const numerosEsperados = Array.from({ length: totalEsperado }, (_, i) => i + 1);
    const numerosActuales = cajas.map(c => c.numero_caja).sort((a, b) => a - b);
    
    const numerosFaltantes = numerosEsperados.filter(n => !numerosActuales.includes(n));
    if (numerosFaltantes.length > 0) {
      errores.push(`Números de caja faltantes: ${numerosFaltantes.join(', ')}`);
    }
    
    const numerosDuplicados = numerosActuales.filter((n, i) => numerosActuales.indexOf(n) !== i);
    if (numerosDuplicados.length > 0) {
      errores.push(`Números de caja duplicados: ${[...new Set(numerosDuplicados)].join(', ')}`);
    }
    
    return {
      valida: errores.length === 0,
      errores,
      totalEsperado,
      totalActual: cajas.length
    };
  } catch (error) {
    console.error('Error al validar numeración de cajas:', error);
    throw error;
  }
}
