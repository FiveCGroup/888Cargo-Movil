// backend/repositories/notification.repository.js
import { BaseRepository } from './base.repository.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  async getByUser(userId) {
    return this.findAll({ user_id: userId });
  }

  async markAsRead(id) {
    return this.update(id, { read: 1 });
  }
}

export default new NotificationRepository();