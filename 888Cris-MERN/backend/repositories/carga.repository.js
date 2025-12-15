// repositories/carga.repository.js
import { BaseRepository } from './base.repository.js';

class CargaRepository extends BaseRepository {
  constructor() {
    super('carga');
  }

  async getByCliente(clienteId) {
    return await this.findAll({ id_cliente: clienteId });
  }

  async getFullCarga(codigoCarga) {
    const sql = `
      SELECT 
        c.*, 
        cl.nombre_cliente, cl.cliente_shippingMark,
        COUNT(DISTINCT a.id_articulo) as total_articulos,
        COUNT(DISTINCT ca.id_caja) as total_cajas,
        COUNT(DISTINCT q.id_qr) as total_qrs
      FROM carga c
      JOIN clientes cl ON c.id_cliente = cl.id_cliente
      LEFT JOIN articulo_packing_list a ON c.id_carga = a.id_carga
      LEFT JOIN caja ca ON a.id_articulo = ca.id_articulo
      LEFT JOIN qr q ON ca.id_caja = q.id_caja
      WHERE c.codigo_carga = ?
      GROUP BY c.id_carga
    `;
    const rows = await this.executeQuery(sql, [codigoCarga]);
    return rows[0] || null;
  }

  async getDashboardStats() {
    const stats = await this.executeQuery(`
      SELECT 
        COUNT(*) as total_cargas,
        SUM(CASE WHEN estado = 'Entregada' THEN 1 ELSE 0 END) as entregadas,
        SUM(CASE WHEN estado = 'En bodega China' THEN 1 ELSE 0 END) as en_china,
        SUM(cbm_total) as total_cbm
      FROM carga
    `);
    return stats[0];
  }
}

export default new CargaRepository();