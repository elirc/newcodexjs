const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

/**
 * Validates runtime environment values.
 * @returns {{nodeEnv: string, port: number, databaseUrl: string, clientOrigin: string}}
 */
function loadEnv() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3003),
    databaseUrl: process.env.DATABASE_URL,
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  };
}

module.exports = loadEnv();
