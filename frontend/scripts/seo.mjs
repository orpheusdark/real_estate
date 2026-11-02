import { loadEnv } from 'vite';
import { writeFile, readFile } from 'node:fs/promises';
const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const site =
  env.VITE_SITE_URL ||
  (env.VERCEL_PROJECT_PRODUCTION_URL
    ? 'https://' + env.VERCEL_PROJECT_PRODUCTION_URL
    : 'http://localhost:5173');
const api = env.VITE_API_URL || site;
for (const url of [site, api]) {
  const parsed = new URL(url);
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/'
  )
    throw new Error('Use a plain HTTP(S) origin for VITE_SITE_URL and VITE_API_URL');
}
await writeFile(
  'public/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /login\nDisallow: /register\nDisallow: /viewing\nDisallow: /reset-password\nSitemap: ${api}/sitemap.xml\n`,
);
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const sampleHomes = JSON.parse(
  await readFile(new URL('../../shared/sample-properties.json', import.meta.url), 'utf8').catch(
    () => '[]',
  ),
);
await writeFile(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', '/properties', ...(!env.VITE_API_URL ? sampleHomes.map((p) => '/properties/' + p.id) : [])].map((p) => `<url><loc>${escape(site + p)}</loc></url>`).join('')}</urlset>`,
);
