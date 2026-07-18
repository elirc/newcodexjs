const app = require('./app');
const { env } = require('./config/env');

/**
 * Logs a concise startup message so local learners know which port is serving the API.
 *
 * @returns {void}
 */
function logStartup() {
  console.log(`Task manager API listening on port ${env.port}`);
}

/**
 * Starts the HTTP server after environment validation and app configuration have completed.
 *
 * @returns {object} Node HTTP server instance.
 */
function startServer() {
  return app.listen(env.port, logStartup);
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
