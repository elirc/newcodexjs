import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Creates the Vite configuration for the polling chat client. */
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 }
});

