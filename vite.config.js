
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // base: '/ui/',   // asta spune Vite să servească toate resursele sub /ui/
  build: {
    outDir: 'dist/ui',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve( __dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // ✅ permite acces din rețeaua Docker și local
    cors: true,       // ✅ necesar pentru cereri între gateway/client
    allowedHosts: [
      'localhost', // ✅ nu pune portul, doar hostul!
      '127.0.0.1',
      'client',    // ✅ numele serviciului Docker pentru frontend
      'edge'       // ✅ numele serviciului gateway Spring
    ],
  },
});
