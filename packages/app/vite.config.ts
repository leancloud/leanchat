import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // vscode remote port forwarding not support ipv6 :badbad:
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:3000',
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
