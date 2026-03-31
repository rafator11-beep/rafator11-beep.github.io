import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
// Removed viteSingleFile to allow correct code splitting

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: 4096, // Keep small assets inline, externalize large ones
    rollupOptions: {
      external: ['stream', 'buffer', 'process', 'node:stream', 'node:buffer', 'node:process'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'sonner'],
        },
      },
    },
    minify: true,
    sourcemap: false,
  }
});
