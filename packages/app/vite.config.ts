import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
});
