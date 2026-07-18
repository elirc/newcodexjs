const app = require("./app");
const { env } = require("./config/env");
/** Starts the HTTP server for local learning. */
app.listen(env.port, () => console.log("Notes App API listening on " + env.port));
