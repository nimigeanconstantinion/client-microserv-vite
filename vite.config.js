
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/ui/',   // asta spune Vite să servească toate resursele sub /ui/
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
    // Local-only stand-in for Kong's api.icode.mywire.org path split (DEPLOY_PLAN_client-vite.md B5):
    // /api/v1/command/* -> data-service (8081), /api/v1/query -> importer-service (8082).
    proxy: {
      '/api/v1/command': 'http://localhost:8081',
      '/api/v1/query': 'http://localhost:8082',
    },
    allowedHosts: [
      'localhost', // ✅ nu pune portul, doar hostul!
      '127.0.0.1',
      "host.docker.internal",
      'client',    // ✅ numele serviciului Docker pentru frontend
      'edge',
      'react-app.local',// ✅ numele serviciului gateway Spring
      'icode.mywire.org'
    ],
  },
});
