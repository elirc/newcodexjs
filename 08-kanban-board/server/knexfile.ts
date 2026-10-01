import type { Knex } from "knex";
import { env } from "./src/config/env.js";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL || env.database,
    migrations: { directory: "./db/migrations", extension: "ts" },
    seeds: { directory: "./db/seeds", extension: "ts" },
  },
};

export default config;
