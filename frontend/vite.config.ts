import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type ProxyOptions } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const api: ProxyOptions = {
  target: 'http://localhost:3000',
  bypass(req) {
    if (req.headers.accept?.includes('text/html')) return '/index.html';
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The user confirms updates from a toast, so an open bet ticket is never reloaded away.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'WagerDesk',
        short_name: 'WagerDesk',
        description: 'Wagering operations desk: exposure, bets, clients and live cricket.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#172554',
        background_color: '#f5f6f8',
        lang: 'en',
        categories: ['business', 'finance', 'sports'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Place bet', url: '/bets?ticket=1', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Bets', url: '/bets', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Live cricket', url: '/cricket', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Only the app shell is cached. API responses (balances, exposure, scores) always come from the network.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': api,
      '/users': api,
      '/ledger': api,
      '/cricket': api,
    },
  },
});
