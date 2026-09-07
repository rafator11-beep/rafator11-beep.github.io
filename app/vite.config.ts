import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
// Removed viteSingleFile to allow correct code splitting

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = "docs"; // GitHub Pages serves this repo from main → /docs

/**
 * GitHub Pages is static + has no SPA rewrite. Serve a copy of index.html as
 * 404.html so deep links / refreshes on client routes still boot the app,
 * and drop a .nojekyll so Pages doesn't strip build files.
 */
function githubPagesSpaFallback(): Plugin {
  return {
    name: "github-pages-spa-fallback",
    apply: "build",
    closeBundle() {
      const dir = path.resolve(__dirname, OUT_DIR);
      const indexHtml = path.join(dir, "index.html");
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, path.join(dir, "404.html"));
      }
      fs.writeFileSync(path.join(dir, ".nojekyll"), "");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,webp,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
        ],
      },
      manifest: {
        name: 'BEEP – Juego de Fiesta',
        short_name: 'BEEP',
        description: 'El mejor juego de fiesta para jugar con amigos',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'favicon.ico', sizes: '48x48', type: 'image/x-icon' },
          { src: 'beep-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'beep-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
    githubPagesSpaFallback(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
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
