import app from "./app";
import { env } from "./config/env";

/** Starts the HTTP server for local learning. */
app.listen(env.port, () => console.log("Kanban Board API listening on " + env.port));
