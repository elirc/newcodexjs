const { env } = require("./src/config/env");

module.exports = {
  development: {
    client: "pg",
    connection: env.database,
    migrations: { directory: "./db/migrations" },
    seeds: { directory: "./db/seeds" }
  }
};
