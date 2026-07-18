import "dotenv/config";
import type { Knex } from "knex";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: { directory: "./db/migrations", extension: "ts" },
    seeds: { directory: "./db/seeds", extension: "ts" }
  }
};

/** Exposes Knex configuration for chat migrations and seeds. */
export default config;

