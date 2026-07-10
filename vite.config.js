import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    /* В dev-режиме запросы /api/* уходят на Express (порт 3001) */
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
