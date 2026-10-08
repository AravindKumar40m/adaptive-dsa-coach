import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, forward /api calls to the Express server so the browser sees one origin.
// changeOrigin must stay false: the API refuses POSTs whose Origin does not match the Host it receives (a defence
// against other websites), and the string shorthand "/api": url would rewrite Host and break every login.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": { target: process.env.API_URL ?? "http://localhost:4000", changeOrigin: false } }, // API_URL: point at another API (see server/scripts/dev-fake-ai.js)
  },
});
