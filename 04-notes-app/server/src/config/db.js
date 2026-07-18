const knex = require("knex");
const { env } = require("./env");

/** Shared Knex instance for model functions. */
const db = knex({ client: "pg", connection: env.database, pool: { min: 0, max: 10 } });

module.exports = { db };
