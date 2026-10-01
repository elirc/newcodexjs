import { createApp } from "./app.js";
import { env } from "./config/env.js";

/** Starts the HTTP server for the survey builder API. */
createApp().listen(env.PORT, () => {
  console.log(`Survey Builder API listening on ${env.PORT}`);
});
