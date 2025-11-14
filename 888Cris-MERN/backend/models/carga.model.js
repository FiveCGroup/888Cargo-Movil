import { query, run, get } from '../db.js';

// Crear una nueva carga
export async function createCarga(cargaData) {
  const {
    codigo_carga,
    direccion_destino,
    archivo_original,
    id_cliente
  } = cargaData;

  try {
    const result = await run(
      `INSERT INTO carga (codigo_carga, direccion_destino, archivo_original, id_cliente, fecha_inicio) VALUES (?, ?, ?, ?, datetime('now'))`,
      [codigo_carga, direccion_destino, archivo_original, id_cliente]
    );
    
    // Obtener la carga recién creada
    const newCarga = await get('SELECT * FROM carga WHERE id_carga = ?', [result.id]);
    return newCarga;
  } catch (error) {
    console.error('Error al crear carga:', error);
    throw error;
  }
}

// Obtener todas las cargas
export async function getAllCargas() {
  try {
    const result = await query(`
      SELECT c.*, cli.nombre_cliente 
      FROM carga c
      LEFT JOIN cliente cli ON c.id_cliente = cli.id_cliente
      ORDER BY c.fecha_creacion DESC
    `);
    return result;
  } catch (error) {
    console.error('Error al obtener todas las cargas:', error);
    throw error;
  }
}

// Obtener una carga por ID
export async function getCargaById(id_carga) {
  try {
    const result = await get('SELECT * FROM carga WHERE id_carga = ?', [id_carga]);
    return result;
  } catch (error) {
    console.error('Error al buscar carga por ID:', error);
    throw error;
  }
}

// Obtener una carga por su código
export async function getCargaByCodigo(codigo_carga) {
  try {
    const result = await get('SELECT * FROM carga WHERE codigo_carga = ?', [codigo_carga]);
    return result;
  } catch (error) {
    console.error('Error al buscar carga por código:', error);
    throw error;
  }
}

// Obtener cargas por cliente
export async function getCargasByCliente(id_cliente) {
  try {
    const result = await query(
      'SELECT * FROM carga WHERE id_cliente = ? ORDER BY fecha_creacion DESC',
      [id_cliente]
    );
    return result;
  } catch (error) {
    console.error('Error al obtener cargas por cliente:', error);
    throw error;
  }
}

// Actualizar una carga existente
export async function updateCarga(id_carga, cargaData) {
  const {
    codigo_carga,
    direccion_destino,
    archivo_original
  } = cargaData;

  try {
    await run(
      `UPDATE carga SET codigo_carga = ?, direccion_destino = ?, archivo_original = ? WHERE id_carga = ?`,
      [codigo_carga, direccion_destino, archivo_original, id_carga]
    );
    
    // Obtener la carga actualizada
    const updatedCarga = await getCargaById(id_carga);
    return updatedCarga;
  } catch (error) {
    console.error('Error al actualizar carga:', error);
    throw error;
  }
}

// Eliminar una carga
export async function deleteCarga(id_carga) {
  try {
    const cargaToDelete = await getCargaById(id_carga);
    
    // Primero eliminamos los artículos relacionados
    await run('DELETE FROM articulo_packing_list WHERE id_carga = ?', [id_carga]);
    
    // Luego eliminamos la carga
    await run('DELETE FROM carga WHERE id_carga = ?', [id_carga]);
    return cargaToDelete;
  } catch (error) {
    console.error('Error al eliminar carga:', error);
    throw error;
  }
}
