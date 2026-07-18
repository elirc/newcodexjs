const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

const required = ["DATABASE_URL"];

/**
 * Reads and validates runtime environment values before the API starts.
 * @returns {{nodeEnv: string, port: number, databaseUrl: string, clientOrigin: string}}
 */
function loadEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3002),
    databaseUrl: process.env.DATABASE_URL,
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5172"
  };
}

module.exports = loadEnv();
