import app from "./app.js";
import { env } from "./config/env.js";

/** Starts the HTTP server for local learning. */
app.listen(env.port, () =>
  console.log("Blog Platform API listening on " + env.port),
);
