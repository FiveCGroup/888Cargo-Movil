import { BaseRepository } from './base.repository.js';
export default new (class extends BaseRepository {
  constructor() { super('audit_log'); }
  async log(userId, action, entityType, entityId, details) {
    await this.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: JSON.stringify(details || {})
    });
  }
})();