// repositories/user.repository.js
import { BaseRepository } from './base.repository.js';

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async findByUsername(username) {
    return await this.findOne({ username });
  }

  async getUserWithRoles(userId) {
    const sql = `
      SELECT u.*, r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
    `;
    const rows = await this.executeQuery(sql, [userId]);
    return rows[0] || null;
  }

  async getAllWithRoles() {
    const sql = `
      SELECT u.*, GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
    `;
    return await this.executeQuery(sql);
  }
}

export default new UserRepository();