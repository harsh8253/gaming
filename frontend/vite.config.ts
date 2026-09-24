import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

const api: ProxyOptions = {
  target: 'http://localhost:3000',
  bypass(req) {
    if (req.headers.accept?.includes('text/html')) return '/index.html';
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
