import knex from "knex";
import knexConfig from "../../knexfile.js";
import { env } from "./env.js";

export const db = knex(knexConfig[env.nodeEnv] ?? knexConfig.development);
