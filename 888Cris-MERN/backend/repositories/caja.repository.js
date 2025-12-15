// repositories/caja.repository.js
import { BaseRepository } from './base.repository.js';

class CajaRepository extends BaseRepository {
  constructor() {
    super('caja');
  }

  async getByArticulo(articuloId) {
    return await this.findAll({ id_articulo: articuloId });
  }

  async getNextBoxNumber(articuloId) {
    const row = await this.executeQuery(
      'SELECT COALESCE(MAX(numero_caja), 0) + 1 as next FROM caja WHERE id_articulo = ?',
      [articuloId]
    );
    return row[0].next;
  }
}

export default new CajaRepository();