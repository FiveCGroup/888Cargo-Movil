// repositories/cliente.repository.js
import { BaseRepository } from './base.repository.js';

class ClienteRepository extends BaseRepository {
  constructor() {
    super('clientes');
  }

  async findByShippingMark(shippingMark) {
    return await this.findOne({ cliente_shippingMark: shippingMark });
  }

  async search(term) {
    const sql = `
      SELECT * FROM clientes 
      WHERE nombre_cliente LIKE ? 
         OR correo_cliente LIKE ? 
         OR cliente_shippingMark LIKE ?
    `;
    const likeTerm = `%${term}%`;
    return await this.executeQuery(sql, [likeTerm, likeTerm, likeTerm]);
  }
}

export default new ClienteRepository();