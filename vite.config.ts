import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the build works from any static host path.
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
});
