import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

/** Reads and validates runtime configuration once at startup. */
export function getEnv() {
  return {
    port: Number(process.env.PORT || 4108),
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    database: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "kanban_board_dev",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
    }
  } as const;
}

export const env = getEnv();
