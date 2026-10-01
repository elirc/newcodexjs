import type { Knex } from "knex";
import { env } from "./src/config/env.js";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: env.database,
    migrations: { directory: "./db/migrations", extension: "ts", loadExtensions: [".ts"] },
    seeds: { directory: "./db/seeds", extension: "ts", loadExtensions: [".ts"] }
  }
};

export default config;
