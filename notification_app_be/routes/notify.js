const router = require('express').Router();
const NotificationService        = require('../services/notificationService');
const { validateNotification }   = require('../utils/validator');

const service = new NotificationService();

// POST /notify  — send a notification
router.post('/', (req, res, next) => {
  try {
    const { userId, message, channel } = req.body;
    validateNotification(req.body);
    const notification = service.send(userId, message, channel);
    return res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
});

// GET /notify/:userId  — fetch all notifications for a user
router.get('/:userId', (req, res) => {
  const notifications = service.getByUser(req.params.userId);
  return res.json({
    userId: req.params.userId,
    count:  notifications.length,
    notifications
  });
});

module.exports = router;
