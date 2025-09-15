import { query, insert, get } from '../db/database.js';

/**
 * Modelo para la tabla articulo_packing_list
 * Gestiona los artículos del packing list
 */

// ================== OPERACIONES CRUD BÁSICAS ==================

// Crear un nuevo artículo en la lista de empaque
export async function createArticulo(articuloData) {
  const {
    id_carga,
    secuencia,
    fecha,
    marca_cliente,
    tel_cliente,
    ciudad_destino,
    phto,
    cn,
    ref_art,
    descripcion_espanol,
    descripcion_chino,
    unit,
    precio_unit = 0,
    precio_total = 0,
    material,
    unidades_empaque = 0,
    marca_producto,
    cajas = 0,
    cant_por_caja = 0,
    cant_total = 0,
    largo = 0,
    ancho = 0,
    alto = 0,
    cbm = 0,
    cbmtt = 0,
    gw = 0,
    gwtt = 0,
    serial,
    imagen_url
  } = articuloData;

  try {
    const result = await insert(
      `INSERT INTO articulo_packing_list 
      (id_carga, secuencia, fecha, marca_cliente, tel_cliente, ciudad_destino, phto, cn,
       ref_art, descripcion_espanol, descripcion_chino, unit, precio_unit, precio_total,
       material, unidades_empaque, marca_producto, cajas, cant_por_caja, cant_total,
       largo, ancho, alto, cbm, cbmtt, gw, gwtt, serial, imagen_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_carga, secuencia, fecha, marca_cliente, tel_cliente, ciudad_destino, phto, cn,
       ref_art, descripcion_espanol, descripcion_chino, unit, precio_unit, precio_total,
       material, unidades_empaque, marca_producto, cajas, cant_por_caja, cant_total,
       largo, ancho, alto, cbm, cbmtt, gw, gwtt, serial, imagen_url]
    );
    
    // Obtener el artículo recién creado
    const newArticulo = await get('SELECT * FROM articulo_packing_list WHERE id_articulo = ?', [result.id]);
    console.log('✅ [Articulo Model] Artículo creado:', newArticulo.id_articulo);
    return newArticulo;
  } catch (error) {
    console.error('❌ [Articulo Model] Error al crear artículo:', error);
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
    
    console.log(`✅ [Articulo Model] ${createdArticulos.length} artículos creados`);
    return createdArticulos;
  } catch (error) {
    console.error('❌ [Articulo Model] Error al crear múltiples artículos:', error);
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
    console.error('❌ [Articulo Model] Error al obtener artículos por carga:', error);
    throw error;
  }
}

// Obtener un artículo por ID
export async function getArticuloById(id_articulo) {
  try {
    const result = await get('SELECT * FROM articulo_packing_list WHERE id_articulo = ?', [id_articulo]);
    return result;
  } catch (error) {
    console.error('❌ [Articulo Model] Error al buscar artículo por ID:', error);
    throw error;
  }
}

// Actualizar un artículo
export async function updateArticulo(id_articulo, articuloData) {
  const {
    secuencia,
    fecha,
    marca_cliente,
    tel_cliente,
    ciudad_destino,
    phto,
    cn,
    ref_art,
    descripcion_espanol,
    descripcion_chino,
    unit,
    precio_unit,
    precio_total,
    material,
    unidades_empaque,
    marca_producto,
    cajas,
    cant_por_caja,
    cant_total,
    largo,
    ancho,
    alto,
    cbm,
    cbmtt,
    gw,
    gwtt,
    serial,
    imagen_url
  } = articuloData;

  try {
    await query(
      `UPDATE articulo_packing_list SET 
        secuencia = ?, fecha = ?, marca_cliente = ?, tel_cliente = ?, ciudad_destino = ?,
        phto = ?, cn = ?, ref_art = ?, descripcion_espanol = ?, descripcion_chino = ?,
        unit = ?, precio_unit = ?, precio_total = ?, material = ?, unidades_empaque = ?,
        marca_producto = ?, cajas = ?, cant_por_caja = ?, cant_total = ?,
        largo = ?, ancho = ?, alto = ?, cbm = ?, cbmtt = ?, gw = ?, gwtt = ?,
        serial = ?, imagen_url = ?
       WHERE id_articulo = ?`,
      [secuencia, fecha, marca_cliente, tel_cliente, ciudad_destino, phto, cn,
       ref_art, descripcion_espanol, descripcion_chino, unit, precio_unit, precio_total,
       material, unidades_empaque, marca_producto, cajas, cant_por_caja, cant_total,
       largo, ancho, alto, cbm, cbmtt, gw, gwtt, serial, imagen_url, id_articulo]
    );
    
    // Obtener el artículo actualizado
    const updatedArticulo = await getArticuloById(id_articulo);
    return updatedArticulo;
  } catch (error) {
    console.error('❌ [Articulo Model] Error al actualizar artículo:', error);
    throw error;
  }
}

// Eliminar un artículo
export async function deleteArticulo(id_articulo) {
  try {
    const articuloToDelete = await getArticuloById(id_articulo);
    
    // Eliminar cajas y QRs relacionados (cascada)
    await query('DELETE FROM caja WHERE id_articulo = ?', [id_articulo]);
    
    // Eliminar el artículo
    await query('DELETE FROM articulo_packing_list WHERE id_articulo = ?', [id_articulo]);
    return articuloToDelete;
  } catch (error) {
    console.error('❌ [Articulo Model] Error al eliminar artículo:', error);
    throw error;
  }
}

// ================== OPERACIONES ESPECIALES ==================

// Obtener estadísticas de artículos por carga
export async function getEstadisticasArticulos(id_carga) {
  try {
    const stats = await get(`
      SELECT 
        COUNT(*) as total_articulos,
        SUM(cajas) as total_cajas,
        SUM(cant_total) as total_cantidad,
        SUM(precio_total) as valor_total,
        SUM(cbmtt) as cbm_total,
        SUM(gwtt) as peso_total,
        AVG(precio_unit) as precio_promedio
      FROM articulo_packing_list 
      WHERE id_carga = ?
    `, [id_carga]);
    
    return stats;
  } catch (error) {
    console.error('❌ [Articulo Model] Error al obtener estadísticas:', error);
    throw error;
  }
}

// Validar datos de artículo
export function validarDatosArticulo(articuloData) {
  const errores = [];
  
  if (!articuloData.id_carga) {
    errores.push('ID de carga es requerido');
  }
  
  if (!articuloData.descripcion_espanol && !articuloData.descripcion_chino) {
    errores.push('Al menos una descripción es requerida');
  }
  
  if (articuloData.cajas && articuloData.cajas < 0) {
    errores.push('Número de cajas no puede ser negativo');
  }
  
  if (articuloData.cant_total && articuloData.cant_total < 0) {
    errores.push('Cantidad total no puede ser negativa');
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
}

export default {
  createArticulo,
  createMultipleArticulos,
  getArticulosByCarga,
  getArticuloById,
  updateArticulo,
  deleteArticulo,
  getEstadisticasArticulos,
  validarDatosArticulo
};