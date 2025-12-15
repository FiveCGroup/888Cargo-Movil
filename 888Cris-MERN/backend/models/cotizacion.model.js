import db from '../db.js';

export class Cotizacion {
  static async crear(data) {
    const {
      user_id,
      tipo,
      destino,
      largo_cm,
      ancho_cm,
      alto_cm,
      peso_kg,
      volumen_m3,
      peso_volumetrico,
      peso_cobrable,
      volumen_cobrable,
      tarifa_usd,
      valor_usd,
      valor_cop,
      trm,
      detalle_calculo
    } = data;

    const query = `
      INSERT INTO cotizaciones (
        user_id, tipo, destino, largo_cm, ancho_cm, alto_cm, peso_kg,
        volumen_m3, peso_volumetrico, peso_cobrable, volumen_cobrable,
        tarifa_usd, valor_usd, valor_cop, trm, detalle_calculo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const result = await db.run(query, [
      user_id,
      tipo,
      destino,
      largo_cm,
      ancho_cm,
      alto_cm,
      peso_kg,
      volumen_m3,
      peso_volumetrico,
      peso_cobrable || null,
      volumen_cobrable || null,
      tarifa_usd,
      valor_usd,
      valor_cop,
      trm,
      JSON.stringify(detalle_calculo)
    ]);

    return result.lastID;
  }

  static async obtenerPorUsuario(userId, limit = 10) {
    const query = `
      SELECT * FROM cotizaciones 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    return await db.all(query, [userId, limit]);
  }

  static async obtenerPorId(id) {
    const query = 'SELECT * FROM cotizaciones WHERE id = ?';
    return await db.get(query, [id]);
  }

  static async eliminar(id) {
    const query = 'DELETE FROM cotizaciones WHERE id = ?';
    return await db.run(query, [id]);
  }
}