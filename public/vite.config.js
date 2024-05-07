import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [], // plugin configurations
  server: {
    proxy: {
      '/api': 'http://localhost:3000' // Proxy all "/api" requests to your backend server
    }
  }
});
