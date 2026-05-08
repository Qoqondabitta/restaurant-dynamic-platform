import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/menu': 'https://restaurant-dynamic-platform.onrender.com',
      '/uploads': 'https://restaurant-dynamic-platform.onrender.com',
    },
  },
});
