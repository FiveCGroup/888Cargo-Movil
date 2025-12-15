// repositories/qr.repository.js
import { BaseRepository } from './base.repository.js';

class QRRepository extends BaseRepository {
  constructor() {
    super('qr');
  }

  async findByCode(codigo) {
    return await this.findOne({ codigo_qr: codigo });
  }

  async markAsScanned(qrId, userId = null) {
    const now = new Date().toISOString();
    return await this.update(qrId, {
      fecha_escaneado: now,
      escaneado_por: userId,
      contador_escaneos: 'contador_escaneos + 1',
      estado: 'escaneado'
    });
  }

  async getStats() {
    return (await this.executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'escaneado' THEN 1 ELSE 0 END) as escaneados
      FROM qr
    `))[0];
  }
}

export default new QRRepository();