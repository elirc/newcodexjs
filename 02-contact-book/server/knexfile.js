require("dotenv").config({ path: "../.env" });

const connection = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/contact_book_dev";

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
