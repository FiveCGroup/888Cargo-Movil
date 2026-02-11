// services/controlCargas.service.js
// Servicio para el módulo "Control de Cargas" - Manejo de cargas por cliente
import databaseRepository from '../repositories/index.js';

const { cargas, clientes, contenedores, articulos, cajas } = databaseRepository;

/**
 * Obtener el cliente asociado a un usuario autenticado
 * @param {string} userEmail - Email del usuario autenticado
 * @returns {Promise<Object|null>} - Cliente encontrado o null
 */
export const obtenerClientePorEmail = async (userEmail) => {
  try {
    const cliente = await clientes.findOne({ correo_cliente: userEmail });
    return cliente;
  } catch (error) {
    console.error('Error al obtener cliente por email:', error);
    throw new Error('Error al obtener información del cliente');
  }
};

/**
 * Obtener todas las cargas de un cliente con filtros opcionales
 * @param {number} clienteId - ID del cliente
 * @param {Object} filtros - Filtros opcionales: { estado, ubicacion, contenedor }
 * @returns {Promise<Array>} - Lista de cargas con información completa
 */
export const obtenerCargasCliente = async (clienteId, filtros = {}) => {
  try {
    let sql = `
      SELECT 
        c.id_carga,
        c.codigo_carga,
        c.shipping_mark,
        c.estado,
        c.ubicacion_actual as ubicacion,
        c.destino,
        c.contenedor_asociado,
        c.fecha_recepcion,
        c.fecha_envio,
        c.fecha_arribo,
        c.gw_total,
        c.cbm_total,
        c.total_cajas,
        c.created_at,
        c.updated_at,
        cl.nombre_cliente
      FROM carga c
      LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
      WHERE c.id_cliente = ?
    `;
    
    const params = [clienteId];
    const condiciones = [];

    // Aplicar filtros opcionales
    if (filtros.estado) {
      condiciones.push('c.estado = ?');
      params.push(filtros.estado);
    }

    if (filtros.ubicacion) {
      condiciones.push('c.ubicacion_actual = ?');
      params.push(filtros.ubicacion);
    }

    if (filtros.contenedor) {
      // Buscar cargas asociadas a un contenedor específico
      condiciones.push(`
        (c.contenedor_asociado = ? OR 
         EXISTS (
           SELECT 1 FROM carga_contenedor cc 
           JOIN contenedores cont ON cc.id_contenedor = cont.id_contenedor
           WHERE cc.id_carga = c.id_carga 
           AND cont.numero_contenedor = ?
         ))
      `);
      params.push(filtros.contenedor);
      params.push(filtros.contenedor);
    }

    if (condiciones.length > 0) {
      sql += ' AND ' + condiciones.join(' AND ');
    }

    // Ordenar por fecha de creación descendente (más recientes primero)
    sql += ' ORDER BY c.created_at DESC';

    const cargasResult = await cargas.executeQuery(sql, params);

    // Formatear los resultados para el frontend
    return cargasResult.map(carga => ({
      id_carga: carga.id_carga,
      codigo_carga: carga.codigo_carga,
      shipping_mark: carga.shipping_mark || '',
      estado: carga.estado || 'En bodega China',
      ubicacion: carga.ubicacion || 'China',
      destino: carga.destino || '',
      contenedor_asociado: carga.contenedor_asociado || null,
      fecha_recepcion: carga.fecha_recepcion,
      fecha_envio: carga.fecha_envio,
      fecha_arribo: carga.fecha_arribo,
      gw_total: carga.gw_total,
      cbm_total: carga.cbm_total,
      total_cajas: carga.total_cajas,
      created_at: carga.created_at,
      updated_at: carga.updated_at,
      nombre_cliente: carga.nombre_cliente
    }));
  } catch (error) {
    console.error('Error al obtener cargas del cliente:', error);
    throw new Error('Error al obtener las cargas del cliente');
  }
};

/**
 * Obtener estados detallados de una carga específica
 * Incluye historial de estados, ubicaciones y eventos relacionados
 * @param {number} cargaId - ID de la carga
 * @param {number} clienteId - ID del cliente (para validar acceso)
 * @returns {Promise<Object>} - Información detallada de estados de la carga
 */
export const obtenerEstadosCarga = async (cargaId, clienteId) => {
  try {
    // Verificar que la carga pertenece al cliente
    const carga = await cargas.findOne({ id_carga: cargaId });
    
    if (!carga) {
      throw new Error('Carga no encontrada');
    }

    if (carga.id_cliente !== clienteId) {
      throw new Error('Acceso denegado: esta carga no pertenece al cliente');
    }

    // Obtener información completa de la carga
    const sql = `
      SELECT 
        c.id_carga,
        c.codigo_carga,
        c.shipping_mark,
        c.estado,
        c.ubicacion_actual,
        c.destino,
        c.contenedor_asociado,
        c.fecha_recepcion,
        c.fecha_envio,
        c.fecha_arribo,
        c.observaciones,
        c.gw_total,
        c.cbm_total,
        c.total_cajas,
        c.created_at,
        c.updated_at,
        cl.nombre_cliente,
        cl.correo_cliente,
        cl.telefono_cliente,
        -- Información del contenedor si existe
        cont.numero_contenedor,
        cont.estado as estado_contenedor,
        cont.destino_final as destino_contenedor,
        cont.fecha_salida_programada,
        -- Estadísticas de artículos y cajas
        COUNT(DISTINCT a.id_articulo) as total_articulos,
        COUNT(DISTINCT ca.id_caja) as total_cajas_real,
        COUNT(DISTINCT q.id_qr) as total_qrs,
        COUNT(DISTINCT CASE WHEN q.estado = 'escaneado' THEN q.id_qr END) as qrs_escaneados
      FROM carga c
      LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
      LEFT JOIN carga_contenedor cc ON c.id_carga = cc.id_carga
      LEFT JOIN contenedores cont ON cc.id_contenedor = cont.id_contenedor
      LEFT JOIN articulo_packing_list a ON c.id_carga = a.id_carga
      LEFT JOIN caja ca ON a.id_articulo = ca.id_articulo
      LEFT JOIN qr q ON ca.id_caja = q.id_caja
      WHERE c.id_carga = ?
      GROUP BY c.id_carga
    `;

    const resultado = await cargas.executeQuery(sql, [cargaId]);
    
    if (!resultado || resultado.length === 0) {
      throw new Error('No se pudo obtener la información detallada de la carga');
    }

    const cargaDetalle = resultado[0];

    // Construir historial de estados basado en las fechas y estados actuales
    const historialEstados = [];
    
    if (cargaDetalle.fecha_recepcion) {
      historialEstados.push({
        estado: 'En bodega China',
        fecha: cargaDetalle.fecha_recepcion,
        ubicacion: 'China',
        descripcion: 'Carga recibida en bodega de origen'
      });
    }

    if (cargaDetalle.fecha_envio) {
      historialEstados.push({
        estado: 'En tránsito',
        fecha: cargaDetalle.fecha_envio,
        ubicacion: cargaDetalle.ubicacion_actual || 'En tránsito',
        descripcion: 'Carga enviada desde origen'
      });
    }

    if (cargaDetalle.fecha_arribo) {
      historialEstados.push({
        estado: 'En despacho',
        fecha: cargaDetalle.fecha_arribo,
        ubicacion: cargaDetalle.destino || 'Destino',
        descripcion: 'Carga arribó a destino'
      });
    }

    // Agregar estado actual si no está en el historial
    const estadoActual = cargaDetalle.estado || 'En bodega China';
    const estadoEnHistorial = historialEstados.some(h => h.estado === estadoActual);
    
    if (!estadoEnHistorial) {
      historialEstados.push({
        estado: estadoActual,
        fecha: cargaDetalle.updated_at || cargaDetalle.created_at,
        ubicacion: cargaDetalle.ubicacion_actual || 'China',
        descripcion: 'Estado actual de la carga'
      });
    }

    // Ordenar historial por fecha
    historialEstados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Obtener packing list completo (articulos + cajas)
    const articulosList = articulos.getByCarga ? await articulos.getByCarga(cargaId) : await articulos.findAll({ id_carga: cargaId });
    const packingList = [];
    if (articulosList && articulosList.length > 0) {
      for (const art of articulosList) {
        const cajasArt = cajas.getByArticulo ? await cajas.getByArticulo(art.id_articulo) : await cajas.findAll({ id_articulo: art.id_articulo });
        packingList.push({
          id_articulo: art.id_articulo,
          fecha: art.fecha,
          cn: art.cn,
          ref_art: art.ref_art,
          descripcion_espanol: art.descripcion_espanol,
          descripcion_chino: art.descripcion_chino,
          unidad: art.unidad,
          precio_unidad: art.precio_unidad,
          precio_total: art.precio_total,
          material: art.material,
          cant_por_caja: art.cant_por_caja,
          cantidad: art.cantidad,
          marca_producto: art.marca_producto,
          serial: art.serial,
          medida_largo: art.medida_largo,
          medida_ancho: art.medida_ancho,
          medida_alto: art.medida_alto,
          cbm: art.cbm,
          gw: art.gw,
          cajas: (cajasArt || []).map(c => ({
            id_caja: c.id_caja,
            numero_caja: c.numero_caja,
            total_cajas: c.total_cajas,
            cantidad_en_caja: c.cantidad_en_caja,
            cbm: c.cbm,
            gw: c.gw,
            descripcion_contenido: c.descripcion_contenido,
            observaciones: c.observaciones,
            estado: c.estado
          }))
        });
      }
    }

    return {
      carga: {
        id_carga: cargaDetalle.id_carga,
        codigo_carga: cargaDetalle.codigo_carga,
        shipping_mark: cargaDetalle.shipping_mark,
        estado_actual: cargaDetalle.estado,
        ubicacion_actual: cargaDetalle.ubicacion_actual,
        destino: cargaDetalle.destino,
        contenedor_asociado: cargaDetalle.contenedor_asociado,
        numero_contenedor: cargaDetalle.numero_contenedor,
        estado_contenedor: cargaDetalle.estado_contenedor,
        destino_contenedor: cargaDetalle.destino_contenedor,
        fecha_salida_programada: cargaDetalle.fecha_salida_programada,
        observaciones: cargaDetalle.observaciones,
        fechas: {
          recepcion: cargaDetalle.fecha_recepcion,
          envio: cargaDetalle.fecha_envio,
          arribo: cargaDetalle.fecha_arribo
        },
        estadisticas: {
          total_articulos: cargaDetalle.total_articulos || 0,
          total_cajas: cargaDetalle.total_cajas_real || cargaDetalle.total_cajas || 0,
          total_qrs: cargaDetalle.total_qrs || 0,
          qrs_escaneados: cargaDetalle.qrs_escaneados || 0,
          peso_total: cargaDetalle.gw_total || 0,
          volumen_total: cargaDetalle.cbm_total || 0
        },
        cliente: {
          nombre: cargaDetalle.nombre_cliente,
          correo: cargaDetalle.correo_cliente,
          telefono: cargaDetalle.telefono_cliente
        }
      },
      historial_estados: historialEstados,
      packing_list: packingList
    };
  } catch (error) {
    console.error('Error al obtener estados de carga:', error);
    throw error;
  }
};

/**
 * Obtener opciones disponibles para los filtros
 * Retorna listas de estados, ubicaciones y contenedores únicos del cliente
 * @param {number} clienteId - ID del cliente
 * @returns {Promise<Object>} - Opciones de filtros disponibles
 */
export const obtenerOpcionesFiltros = async (clienteId) => {
  try {
    // Obtener estados únicos
    const estados = await cargas.executeQuery(
      `SELECT DISTINCT estado FROM carga WHERE id_cliente = ? AND estado IS NOT NULL ORDER BY estado`,
      [clienteId]
    );

    // Obtener ubicaciones únicas
    const ubicaciones = await cargas.executeQuery(
      `SELECT DISTINCT ubicacion_actual as ubicacion FROM carga WHERE id_cliente = ? AND ubicacion_actual IS NOT NULL ORDER BY ubicacion_actual`,
      [clienteId]
    );

    // Obtener contenedores únicos asociados a las cargas del cliente
    const contenedores = await cargas.executeQuery(
      `SELECT DISTINCT 
        COALESCE(c.contenedor_asociado, cont.numero_contenedor) as contenedor
      FROM carga c
      LEFT JOIN carga_contenedor cc ON c.id_carga = cc.id_carga
      LEFT JOIN contenedores cont ON cc.id_contenedor = cont.id_contenedor
      WHERE c.id_cliente = ? 
      AND (c.contenedor_asociado IS NOT NULL OR cont.numero_contenedor IS NOT NULL)
      ORDER BY contenedor`,
      [clienteId]
    );

    return {
      estados: estados.map(e => e.estado),
      ubicaciones: ubicaciones.map(u => u.ubicacion),
      contenedores: contenedores.map(c => c.contenedor).filter(c => c !== null)
    };
  } catch (error) {
    console.error('Error al obtener opciones de filtros:', error);
    throw new Error('Error al obtener opciones de filtros');
  }
};
