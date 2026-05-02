const VALID_CHANNELS = ['email', 'sms', 'push', 'in_app'];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name       = 'ValidationError';
    this.statusCode = 400;
  }
}

function validateNotification(body) {
  const { userId, message, channel } = body || {};

  if (!userId || typeof userId !== 'string' || !userId.trim())
    throw new ValidationError('userId must be a non-empty string');

  if (!message || typeof message !== 'string' || !message.trim())
    throw new ValidationError('message must be a non-empty string');

  if (message.length > 1000)
    throw new ValidationError('message must not exceed 1000 characters');

  if (channel && !VALID_CHANNELS.includes(channel))
    throw new ValidationError(`Invalid channel "${channel}". Valid: ${VALID_CHANNELS.join(', ')}`);
}

module.exports = { validateNotification, ValidationError };
