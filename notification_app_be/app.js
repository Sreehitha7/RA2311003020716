const express      = require('express');
const config       = require('./config');
const notifyRoutes = require('./routes/notify');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: config.env });
});

// Routes
app.use('/notify', notifyRoutes);

// Central error handler — must be last
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[notification-service] running on port ${config.port} (${config.env})`);
});

module.exports = app;
