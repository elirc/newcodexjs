import type { Knex } from "knex";
import { env } from "./src/config/env";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: env.database,
    migrations: { directory: "./db/migrations", extension: "ts" },
    seeds: { directory: "./db/seeds", extension: "ts" }
  }
};

export default config;
