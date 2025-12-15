// backend/repositories/recovery-token.repository.js
import { run, get, query } from '../db.js';

const recoveryTokenRepository = {
  async create(data) {
    const result = await run(
      'INSERT INTO recovery_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [data.user_id, data.token, data.expires_at]
    );
    return { id: result.id, ...data };
  },

  async findOne(conditions) {
    const keys = Object.keys(conditions);
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const values = Object.values(conditions);
    return await get(`SELECT * FROM recovery_tokens WHERE ${where}`, values);
  },

  async update(id, data) {
    const keys = Object.keys(data);
    const set = keys.map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    return await run(`UPDATE recovery_tokens SET ${set} WHERE id = ?`, values);
  },

  async executeQuery(sql, params = []) {
    return await query(sql, params);
  }
};

export default recoveryTokenRepository;