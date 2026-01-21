import { run, get, query } from '../db.js';

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

    const sql = `
      INSERT INTO cotizaciones (
        user_id, tipo, destino, largo_cm, ancho_cm, alto_cm, peso_kg,
        volumen_m3, peso_volumetrico, peso_cobrable, volumen_cobrable,
        tarifa_usd, valor_usd, valor_cop, trm, detalle_calculo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const result = await run(sql, [
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

    return result.id;
  }

  static async obtenerPorUsuario(userId, limit = 10) {
    const sql = `
      SELECT * FROM cotizaciones 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    return await query(sql, [userId, limit]);
  }

  static async obtenerPorId(id) {
    const sql = 'SELECT * FROM cotizaciones WHERE id = ?';
    return await get(sql, [id]);
  }

  static async eliminar(id) {
    const sql = 'DELETE FROM cotizaciones WHERE id = ?';
    return await run(sql, [id]);
  }
}