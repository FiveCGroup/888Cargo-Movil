import { query, run, get } from '../db.js';

// Crear un nuevo artículo en la lista de empaque
export async function createArticulo(articuloData) {
  const {
    id_carga,
    secuencia,
    codigo_producto,
    descripcion,
    cantidad,
    precio,
    cbm,
    cbmtt,
    gw,
    gwtt,
    serial,
    imagen_url
  } = articuloData;

  try {
    const result = await run(
      `INSERT INTO articulo_packing_list 
      (id_carga, secuencia, codigo_producto, descripcion, cantidad, precio, cbm, cbmtt, gw, gwtt, serial, imagen_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_carga, secuencia, codigo_producto, descripcion, cantidad, precio, cbm, cbmtt, gw, gwtt, serial, imagen_url]
    );
    
    // Obtener el artículo recién creado
    const newArticulo = await get('SELECT * FROM articulo_packing_list WHERE id_articulo = ?', [result.id]);
    return newArticulo;
  } catch (error) {
    console.error('Error al crear artículo:', error);
    throw error;
  }
}

// Crear múltiples artículos en lote
export async function createMultipleArticulos(articulosData) {
  try {
    const createdArticulos = [];
    
    for (const articuloData of articulosData) {
      const articulo = await createArticulo(articuloData);
      createdArticulos.push(articulo);
    }
    
    return createdArticulos;
  } catch (error) {
    console.error('Error al crear múltiples artículos:', error);
    throw error;
  }
}

// Obtener artículos por ID de carga
export async function getArticulosByCarga(id_carga) {
  try {
    const result = await query(
      'SELECT * FROM articulo_packing_list WHERE id_carga = ? ORDER BY secuencia, id_articulo',
      [id_carga]
    );
    return result;
  } catch (error) {
    console.error('Error al obtener artículos por carga:', error);
    throw error;
  }
}

// Obtener un artículo por ID
export async function getArticuloById(id_articulo) {
  try {
    const result = await get('SELECT * FROM articulo_packing_list WHERE id_articulo = ?', [id_articulo]);
    return result;
  } catch (error) {
    console.error('Error al obtener artículo por ID:', error);
    throw error;
  }
}

// Actualizar un artículo existente
export async function updateArticulo(id_articulo, articuloData) {
  const {
    secuencia,
    codigo_producto,
    descripcion,
    cantidad,
    precio,
    cbm,
    cbmtt,
    gw,
    gwtt,
    serial,
    imagen_url
  } = articuloData;

  try {
    await run(
      `UPDATE articulo_packing_list 
       SET secuencia = ?, codigo_producto = ?, descripcion = ?, cantidad = ?, precio = ?,
           cbm = ?, cbmtt = ?, gw = ?, gwtt = ?, serial = ?, imagen_url = ?
       WHERE id_articulo = ?`,
      [secuencia, codigo_producto, descripcion, cantidad, precio, cbm, cbmtt, gw, gwtt, serial, imagen_url, id_articulo]
    );
    
    // Obtener el artículo actualizado
    const updatedArticulo = await getArticuloById(id_articulo);
    return updatedArticulo;
  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    throw error;
  }
}

// Eliminar un artículo
export async function deleteArticulo(id_articulo) {
  try {
    const articuloToDelete = await getArticuloById(id_articulo);
    await run('DELETE FROM articulo_packing_list WHERE id_articulo = ?', [id_articulo]);
    return articuloToDelete;
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    throw error;
  }
}

// Eliminar todos los artículos de una carga
export async function deleteArticulosByCarga(id_carga) {
  try {
    const result = await run('DELETE FROM articulo_packing_list WHERE id_carga = ?', [id_carga]);
    return result;
  } catch (error) {
    console.error('Error al eliminar artículos de la carga:', error);
    throw error;
  }
}
