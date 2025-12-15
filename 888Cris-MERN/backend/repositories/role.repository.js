// repositories/role.repository.js
import { BaseRepository } from './base.repository.js';

class RoleRepository extends BaseRepository {
  constructor() {
    super('roles');
  }

  async getRoleWithPermissions(roleId) {
    const sql = `
      SELECT r.*, p.name as permission_name, p.module
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.id = ?
    `;
    return await this.executeQuery(sql, [roleId]);
  }

  async assignPermission(roleId, permissionId) {
    return await this.executeQuery(
      'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [roleId, permissionId]
    );
  }

  async removePermission(roleId, permissionId) {
    return await this.executeQuery(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [roleId, permissionId]
    );
  }
}

export default new RoleRepository();