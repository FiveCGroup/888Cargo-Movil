// repositories/articulo.repository.js
import { BaseRepository } from './base.repository.js';

class ArticuloRepository extends BaseRepository {
  constructor() {
    super('articulo_packing_list');
  }

  async getByCarga(cargaId) {
    return await this.findAll({ id_carga: cargaId });
  }
}

export default new ArticuloRepository();