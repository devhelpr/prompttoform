import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https: {
      key: fs.readFileSync("cert.key"),
      cert: fs.readFileSync("cert.crt"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        vanilla: "vanilla.html",
      },
    },
  },
});
