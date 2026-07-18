const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

/** Reads and validates runtime configuration once at startup. */
function getEnv() {
  return {
    port: Number(process.env.PORT || 4104),
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    database: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "notes_app_dev",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
    }
  };
}

module.exports = { env: getEnv(), getEnv };
