import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Creates the Vite configuration for the storefront client. */
export default defineConfig({
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [react()],
  server: { port: 5175 },
});
