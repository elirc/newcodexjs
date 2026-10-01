import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const env = {
  port: Number(process.env.PORT || 4117),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "support_ticket_system_dev",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  },
};
