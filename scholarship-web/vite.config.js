import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:7782',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:7782',
        changeOrigin: true,
      }
    }
  }
});
