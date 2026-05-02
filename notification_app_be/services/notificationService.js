const crypto = require('crypto');

class NotificationService {
  constructor() {
    this.store = new Map();
  }

  send(userId, message, channel = 'in_app') {
    const notification = {
      id:        crypto.randomUUID(),
      userId:    userId.trim(),
      message:   message.trim(),
      channel,
      status:    'sent',
      createdAt: new Date().toISOString()
    };
    this.store.set(notification.id, notification);
    return { ...notification };
  }

  getByUser(userId) {
    return Array.from(this.store.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getById(id) {
    const n = this.store.get(id);
    return n ? { ...n } : null;
  }
}

module.exports = NotificationService;
