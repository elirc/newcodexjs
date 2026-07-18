import { createApp } from "./app.js";
import { env } from "./config/env.js";

/** Starts the storefront API server. */
createApp().listen(env.PORT, () => {
  console.log(`E-Commerce Storefront API listening on ${env.PORT}`);
});

