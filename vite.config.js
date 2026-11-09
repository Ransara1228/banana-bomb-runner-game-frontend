import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // every /api call goes to Spring Boot, so the browser sees one site (no CORS, the cookie works)
    proxy: { '/api': 'http://localhost:8080' },
  },
});
