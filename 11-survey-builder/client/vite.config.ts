import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Creates the Vite configuration for the survey builder client. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});

