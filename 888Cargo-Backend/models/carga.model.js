import { query, insert, get } from '../db/database.js';

/**
 * Modelo para la tabla cargas
 * Gestiona las cargas del packing list
 */

// ================== OPERACIONES CRUD BÁSICAS ==================

// Crear una nueva carga
export async function createCarga(cargaData) {
  const {
    codigo_carga,
    id_cliente = 1, // Cliente por defecto
    direccion_destino,
    ciudad_destino,
    archivo_original
  } = cargaData;

  try {
    const result = await insert(
      `INSERT INTO cargas (codigo_carga, id_cliente, direccion_destino, ciudad_destino, archivo_original) 
       VALUES (?, ?, ?, ?, ?)`,
      [codigo_carga, id_cliente, direccion_destino, ciudad_destino, archivo_original]
    );
    
    // Obtener la carga recién creada usando el ID devuelto
    const newCarga = await get('SELECT * FROM cargas WHERE id_carga = ?', [result.id]);
    console.log('✅ [Carga Model] Carga creada:', newCarga);
    return newCarga;
  } catch (error) {
    console.error('❌ [Carga Model] Error al crear carga:', error);
    throw error;
  }
}

// Obtener todas las cargas
export async function getAllCargas() {
  try {
    const result = await query(`
      SELECT c.*, cli.nombre_cliente 
      FROM cargas c
      LEFT JOIN clientes cli ON c.id_cliente = cli.id
      ORDER BY c.fecha_creacion DESC
    `);
    return result;
  } catch (error) {
    console.error('❌ [Carga Model] Error al obtener todas las cargas:', error);
    throw error;
  }
}

// Obtener una carga por ID
export async function getCargaById(id_carga) {
  try {
    const result = await get('SELECT * FROM cargas WHERE id_carga = ?', [id_carga]);
    return result;
  } catch (error) {
    console.error('❌ [Carga Model] Error al buscar carga por ID:', error);
    throw error;
  }
}

// Obtener una carga por su código
export async function getCargaByCodigo(codigo_carga) {
  try {
    const result = await get('SELECT * FROM cargas WHERE codigo_carga = ?', [codigo_carga]);
    return result;
  } catch (error) {
    console.error('❌ [Carga Model] Error al buscar carga por código:', error);
    throw error;
  }
}

// Obtener cargas por cliente
export async function getCargasByCliente(id_cliente) {
  try {
    const result = await query(
      'SELECT * FROM cargas WHERE id_cliente = ? ORDER BY fecha_creacion DESC',
      [id_cliente]
    );
    return result;
  } catch (error) {
    console.error('❌ [Carga Model] Error al obtener cargas por cliente:', error);
    throw error;
  }
}

// Actualizar una carga existente
export async function updateCarga(id_carga, cargaData) {
  const {
    codigo_carga,
    direccion_destino,
    ciudad_destino,
    archivo_original,
    estado,
    total_items,
    peso_total,
    valor_total,
    cbm_total
  } = cargaData;

  try {
    await query(
      `UPDATE cargas SET 
        codigo_carga = ?, direccion_destino = ?, ciudad_destino = ?, 
        archivo_original = ?, estado = ?, total_items = ?, 
        peso_total = ?, valor_total = ?, cbm_total = ?
       WHERE id_carga = ?`,
      [codigo_carga, direccion_destino, ciudad_destino, archivo_original, 
       estado, total_items, peso_total, valor_total, cbm_total, id_carga]
    );
    
    // Obtener la carga actualizada
    const updatedCarga = await getCargaById(id_carga);
    return updatedCarga;
  } catch (error) {
    console.error('❌ [Carga Model] Error al actualizar carga:', error);
    throw error;
  }
}

// Eliminar una carga
export async function deleteCarga(id_carga) {
  try {
    const cargaToDelete = await getCargaById(id_carga);
    
    // Primero eliminamos los artículos relacionados (cascada manejará cajas y QRs)
    await query('DELETE FROM articulo_packing_list WHERE id_carga = ?', [id_carga]);
    
    // Luego eliminamos la carga
    await query('DELETE FROM cargas WHERE id_carga = ?', [id_carga]);
    return cargaToDelete;
  } catch (error) {
    console.error('❌ [Carga Model] Error al eliminar carga:', error);
    throw error;
  }
}

// ================== OPERACIONES ESPECIALES ==================

// Generar código único para carga
export function generarCodigoCarga() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `888CARGO-${timestamp}-${random}`;
}

// Actualizar estadísticas de la carga
export async function actualizarEstadisticasCarga(id_carga) {
  try {
    // Obtener estadísticas de los artículos
    const stats = await get(`
      SELECT 
        COUNT(*) as total_items,
        SUM(cant_total) as total_cantidad,
        SUM(precio_total) as valor_total,
        SUM(cbmtt) as cbm_total,
        SUM(gwtt) as peso_total
      FROM articulo_packing_list 
      WHERE id_carga = ?
    `, [id_carga]);

    if (stats) {
      await query(
        `UPDATE cargas SET 
          total_items = ?, peso_total = ?, valor_total = ?, cbm_total = ?
         WHERE id_carga = ?`,
        [stats.total_items || 0, stats.peso_total || 0, stats.valor_total || 0, 
         stats.cbm_total || 0, id_carga]
      );
    }

    return stats;
  } catch (error) {
    console.error('❌ [Carga Model] Error al actualizar estadísticas:', error);
    throw error;
  }
}

export default {
  createCarga,
  getAllCargas,
  getCargaById,
  getCargaByCodigo,
  getCargasByCliente,
  updateCarga,
  deleteCarga,
  generarCodigoCarga,
  actualizarEstadisticasCarga
};