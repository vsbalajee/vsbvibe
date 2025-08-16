import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['@math.gl/culling', 'vue3-library.es.js']
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
