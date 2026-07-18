import knex from "knex";
import { env } from "./env";

/** Shared Knex instance for model functions. */
export const db = knex({ client: "pg", connection: env.database, pool: { min: 0, max: 10 } });
