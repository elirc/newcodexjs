import app from "./app";
import { env } from "./config/env";

/** Starts the HTTP server for local learning. */
app.listen(env.port, () => console.log("Bookmark Manager API listening on " + env.port));
