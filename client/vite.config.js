import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../');

  return {
    envDir: '../',
    server: {
      port: 3000,
      allowedHosts: [env.VITE_ALLOWED_HOST],
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
      hmr: {
        clientPort: 443,
      },
    },
    plugins: [react(), tailwindcss()],
  };
});
