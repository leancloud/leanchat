import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { iframePlugin } from './plugins/iframe-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    iframePlugin({
      filename: 'widget.js',
      attributes: {
        style: {
          display: 'none',
        },
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/socket.io': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
      },
    },
  },
  base: (process.env.LEANCHAT_BASE_URL ?? '/') + 'chat',
});
