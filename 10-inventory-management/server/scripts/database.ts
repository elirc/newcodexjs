import knex from "knex";
import config from "../knexfile.js";
const db = knex(config.development!);
try {
  if (process.argv[2] === "migrate") await db.migrate.latest();
  else if (process.argv[2] === "seed") await db.seed.run();
  else throw new Error("Use migrate or seed.");
} finally {
  await db.destroy();
}
