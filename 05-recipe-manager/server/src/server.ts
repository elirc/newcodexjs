import { createApp } from './app.js';
import { env } from './config/env.js';

/** Starts the HTTP server after configuration has been validated. */
function start(): void {
  createApp().listen(env.port, () => {
    console.log(`Recipe manager API listening on http://localhost:${env.port}`);
  });
}

start();
