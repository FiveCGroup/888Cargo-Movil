// services/cliente.service.js
import databaseRepository from '../repositories/index.js';

const { cargas, clientes, qr } = databaseRepository;

/**
 * Obtener todas las cargas del cliente autenticado
 */
export const getMisCargas = async (clienteId) => {
  const cargas = await databaseRepository.cargas.getByCliente(clienteId);
  return {
    success: true,
    data: cargas,
    total: cargas.length
  };
};

/**
 * Obtener detalle completo de una carga (para el cliente)
 */
export const getDetalleCargaCliente = async (codigoCarga, clienteId) => {
  const carga = await databaseRepository.cargas.getFullCarga(codigoCarga);
  
  if (!carga) throw new Error('Carga no encontrada');
  if (carga.id_cliente !== clienteId) throw new Error('Acceso denegado');

  return {
    success: true,
    data: carga
  };
};

/**
 * Obtener estadísticas rápidas del cliente
 */
export const getDashboardCliente = async (clienteId) => {
  const [totalCargas, cargasEntregadas, qrsEscaneados] = await Promise.all([
    databaseRepository.cargas.executeQuery('SELECT COUNT(*) as count FROM carga WHERE id_cliente = ?', [clienteId]),
    databaseRepository.cargas.executeQuery('SELECT COUNT(*) as count FROM carga WHERE id_cliente = ? AND estado = "Entregada"', [clienteId]),
    databaseRepository.qr.executeQuery('SELECT COUNT(*) as count FROM qr q JOIN caja c ON q.id_caja = c.id_caja JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo WHERE a.id_carga IN (SELECT id_carga FROM carga WHERE id_cliente = ?) AND q.estado = "escaneado"', [clienteId])
  ]);

  return {
    success: true,
    data: {
      totalCargas: totalCargas[0].count,
      entregadas: cargasEntregadas[0].count,
      qrsEscaneados: qrsEscaneados[0].count
    }
  };
};