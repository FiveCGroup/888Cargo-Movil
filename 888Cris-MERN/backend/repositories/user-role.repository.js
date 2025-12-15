// backend/repositories/user-role.repository.js
import { run, get, query } from '../db.js';

const userRoleRepository = {
  async create(data) {
    const result = await run(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [data.user_id, data.role_id]
    );
    return { id: result.id, ...data };
  },

  async findByUserId(userId) {
    return await query('SELECT * FROM user_roles WHERE user_id = ?', [userId]);
  },

  async executeQuery(sql, params = []) {
    return await query(sql, params);
  },

  async delete(userId, roleId) {
    return await run(
      'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
      [userId, roleId]
    );
  }
};

export default userRoleRepository;