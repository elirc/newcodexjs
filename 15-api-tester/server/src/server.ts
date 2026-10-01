import { app } from "./app.js";
import { env } from "./config/env.js";

/** Starts the API tester backend after configuration has been validated. */
function startServer(): void {
  app.listen(env.port, () => {
    console.log(`API Tester API listening on http://localhost:${env.port}`);
  });
}

startServer();
