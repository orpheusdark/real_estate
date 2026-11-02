import { rm } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'database-sitemap-on-vercel',
      async closeBundle() {
        // A static file takes precedence over Vercel rewrites. Use the API sitemap there.
        if (process.env.VERCEL === '1')
          await rm(new URL('./dist/sitemap.xml', import.meta.url), { force: true });
      },
    },
  ],
  server: { proxy: { '/api': 'http://127.0.0.1:4000', '/uploads': 'http://127.0.0.1:4000' } },
});
