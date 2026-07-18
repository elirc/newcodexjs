require("dotenv").config({ path: "../.env" });

const connection = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/expense_tracker_dev";

module.exports = {
  development: {
    client: "pg",
    connection,
    migrations: { directory: "./db/migrations" },
    seeds: { directory: "./db/seeds" }
  },
  production: {
    client: "pg",
    connection,
    migrations: { directory: "./db/migrations" },
    seeds: { directory: "./db/seeds" }
  }
};
