import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Defines the Vite build pipeline for the task manager client.
 */
export default defineConfig({
  plugins: [react()],
});
