const app = require("./app");
const env = require("./config/env");

/**
 * Starts the HTTP server on the configured port.
 * @returns {import("http").Server}
 */
function startServer() {
  return app.listen(env.port, () => {
    console.log(`Contact Book API listening on port ${env.port}`);
  });
}

startServer();
