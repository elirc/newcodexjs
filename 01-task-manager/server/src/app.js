const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { env } = require('./config/env');
const taskRoutes = require('./routes/taskRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

/**
 * Responds to health checks with the standard success envelope for quick local verification.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {object} JSON response showing the API is running.
 */
function healthCheck(req, res) {
  return res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'task-manager-api'
    }
  });
}

/**
 * Creates and configures the Express app so tests and the server entry point can share setup.
 *
 * @returns {object} Configured Express application.
 */
function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.clientOrigin,
    credentials: true
  }));
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', healthCheck);
  app.use('/api/tasks', taskRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
