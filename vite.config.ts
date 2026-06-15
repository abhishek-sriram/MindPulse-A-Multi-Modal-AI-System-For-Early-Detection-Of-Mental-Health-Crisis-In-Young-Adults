import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 8080,
    // ── Exclude backend venv from file watching ──
    // Without this, Vite tries to watch hundreds of thousands of Python
    // files inside .venv, causing UNKNOWN errors and memory crashes.
    watch: {
      ignored: [
        "**/backend/.venv/**",
        "**/backend/__pycache__/**",
        "**/.venv/**",
        "**/__pycache__/**",
        "**/*.py",
        "**/*.pyc",
      ],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});