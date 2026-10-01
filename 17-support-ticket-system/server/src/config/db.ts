import knex from "knex";
import { env } from "./env.js";

export const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL || env.database,
  pool: { min: 0, max: 10 },
});
