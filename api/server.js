import { createCatalogApp } from '../backend/src/catalog.js';
import { createApp } from '../backend/src/app.js';
import { createStore } from '../backend/src/store.js';
import { configuration } from '../backend/src/config.js';
let appPromise;
async function application() {
  if (!appPromise) {
    appPromise = (async () => {
      if (process.env.LIVE_SERVICES !== 'true') return createCatalogApp();
      const config = configuration({
        ...process.env,
        NODE_ENV: 'production',
        DEMO_MODE: 'false',
        TRUST_PROXY: '1',
      });
      const store = await createStore(config);
      return createApp(store, config);
    })().catch((e) => {
      appPromise = undefined;
      throw e;
    });
  }
  return appPromise;
}
export default async function handler(req, res) {
  const original = new URL(req.url, 'https://estateiq.local');
  const route = String(req.query?.__route || original.searchParams.get('__route') || '');
  const query = { ...req.query };
  delete query.__route;
  delete query.path;
  original.searchParams.delete('__route');
  original.searchParams.delete('path');
  req.url =
    (route === 'sitemap.xml' ? '/sitemap.xml' : '/api/' + route) +
    (original.searchParams.size ? '?' + original.searchParams.toString() : '');
  Object.defineProperty(req, 'query', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: query,
  });
  try {
    const app = await application();
    return app(req, res);
  } catch {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        message: 'The service is temporarily unavailable. Please try again shortly.',
      }),
    );
  }
}
