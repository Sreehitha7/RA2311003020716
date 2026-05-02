const { ValidationError } = require('../utils/validator');

function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error('[ERROR]', {
    message: err.message,
    method:  req.method,
    path:    req.path
  });

  res.status(500).json({ error: 'Internal Server Error' });
}

module.exports = errorHandler;
