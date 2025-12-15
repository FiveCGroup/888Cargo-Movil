// repositories/permission.repository.js
import { BaseRepository } from './base.repository.js';

class PermissionRepository extends BaseRepository {
  constructor() {
    super('permissions');
  }

  async getByModule(module) {
    return await this.findAll({ module });
  }
}

export default new PermissionRepository();