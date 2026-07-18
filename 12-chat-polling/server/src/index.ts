import { createApp } from "./app.js";
import { env } from "./config/env.js";

/** Starts the polling chat API server. */
createApp().listen(env.PORT, () => {
  console.log(`Chat Polling API listening on ${env.PORT}`);
});

