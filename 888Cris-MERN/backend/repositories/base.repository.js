// repositories/base.repository.js
import db, { query, run, get } from '../db.js';

export class BaseRepository {
  constructor(tableName) {
    this.table = tableName;
  }

  async findAll(conditions = {}, orderBy = null) {
    let sql = `SELECT * FROM ${this.table}`;
    const params = [];
    if (Object.keys(conditions).length > 0) {
      sql += ' WHERE ' + Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      params.push(...Object.values(conditions));
    }
    // Añadir ORDER BY solo si se pasó explícitamente
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    return await query(sql, params);
  }

  async findOne(conditions) {
    // Construir consulta independiente para no asumir la existencia de columna `id`
    const keys = Object.keys(conditions || {});
    if (keys.length === 0) return null;
    const whereClause = keys.map(k => `${k} = ?`).join(' AND ');
    const params = Object.values(conditions);
    const sql = `SELECT * FROM ${this.table} WHERE ${whereClause} LIMIT 1`;
    const rows = await query(sql, params);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async findById(id) {
    return await get(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`;
    return await run(sql, values);
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const sql = `UPDATE ${this.table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(id);
    return await run(sql, values);
  }

  async delete(id) {
    return await run(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }

  async executeQuery(sql, params = []) {
    return await query(sql, params);
  }
}