import app from "./app.js";
import { env } from "./config/env.js";

/** Starts the HTTP server for local learning. */
app.listen(env.port, () =>
  console.log("Kanban Board API listening on " + env.port),
);
