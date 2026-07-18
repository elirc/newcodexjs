import knex from "knex";
import { env } from "./env.js";

/** Creates the shared Knex connection. */
export const db = knex({ client: "pg", connection: env.DATABASE_URL });

