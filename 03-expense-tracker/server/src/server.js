const app = require("./app");
const env = require("./config/env");

/**
 * Starts the Expense Tracker API.
 * @returns {import("http").Server}
 */
function startServer() {
  return app.listen(env.port, () => console.log(`Expense Tracker API listening on port ${env.port}`));
}

startServer();
