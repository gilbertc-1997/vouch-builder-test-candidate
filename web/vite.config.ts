import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/handover": "http://localhost:8080", "/health": "http://localhost:8080" } },
  build: { outDir: "dist" },
});
