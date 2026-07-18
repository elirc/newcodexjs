import app from "./app";
import { env } from "./config/env";

/** Starts the HTTP server for local learning. */
app.listen(env.port, () => console.log("Inventory Management API listening on " + env.port));
