import app from "./app";
import { env } from "./config/env";

/** Starts the HTTP server for local learning. */
app.listen(env.port, () => console.log("Job Application Tracker API listening on " + env.port));
