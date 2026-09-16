import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readingsApiPlugin } from './server/readingsApi.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), readingsApiPlugin(env.DATABASE_URL)],
    server: {
      port: 3001,
      host: true,
      strictPort: true,
    },
    preview: {
      port: 3001,
      host: true,
    },
  };
});
