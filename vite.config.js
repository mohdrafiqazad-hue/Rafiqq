import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'favicon-48.png', 'apple-touch-icon.png', 'fonts/*.ttf'],
      manifest: {
        name: 'Madhur Ganga Minerals - Cooler Hisab',
        short_name: 'MGM Hisab',
        description: 'Water cooler ka roz ka hisab: entry, baaki, reports',
        lang: 'hi',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2f5f7',
        theme_color: '#0d6688',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App ki saari files phone me save ho jaati hain, taaki bina internet ke bhi khule
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'node',
  },
});
