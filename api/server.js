import { createCatalogApp } from '../backend/src/catalog.js';
const app = createCatalogApp();
export default function handler(req, res) {
  const original = new URL(req.url, 'https://estateiq.local');
  const route = req.query?.__route || original.searchParams.get('__route') || '';
  original.searchParams.delete('__route');
  req.url =
    '/api/' +
    String(route) +
    (original.searchParams.size ? '?' + original.searchParams.toString() : '');
  // Let Express derive query values from the restored application URL.
  delete req.query;
  return app(req, res);
}
