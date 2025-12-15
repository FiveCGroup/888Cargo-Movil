// repositories/contenedor.repository.js
import { BaseRepository } from './base.repository.js';

class ContenedorRepository extends BaseRepository {
  constructor() {
    super('contenedores');
  }

  async getCargas(contenedorId) {
    const sql = `
      SELECT c.*, cl.nombre_cliente
      FROM carga c
      JOIN carga_contenedor cc ON c.id_carga = cc.id_carga
      JOIN clientes cl ON c.id_cliente = cl.id_cliente
      WHERE cc.id_contenedor = ?
    `;
    return await this.executeQuery(sql, [contenedorId]);
  }
}

export default new ContenedorRepository();