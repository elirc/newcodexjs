import { app } from "./app";
import { env } from "./config/env";

/** Starts the HTTP server after environment validation succeeds. */
function startServer(): void {
  app.listen(env.port, () => {
    console.log(`Appointment Booking API listening on http://localhost:${env.port}`);
  });
}

startServer();
