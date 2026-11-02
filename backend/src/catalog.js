import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import samples from '../../shared/sample-properties.json' with { type: 'json' };
import { propertyRouter } from './properties.js';
import { matches } from './store.js';
const rows = samples.map((p) => ({ ...p, _id: p.id, archived: false }));
const unavailable = {
  message:
    'This is a browsing preview. Accounts, uploads and viewing requests will open when the live services are connected.',
};
export function createCatalogApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-origin' } }),
  );
  app.use(
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      validate: { xForwardedForHeader: false },
    }),
  );
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return res.status(503).json(unavailable);
    next();
  });
  app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', mode: 'showcase', properties: rows.length }),
  );
  app.get(['/api/users/me', '/api/dashboard'], (req, res) => res.status(401).json(unavailable));
  const store = {
    one: async (table, q) =>
      table === 'properties' ? rows.find((p) => matches(p, q)) || null : null,
    pageProperties: async (query, sort, page, limit) => {
      const filtered = rows.filter((p) => matches(p, query));
      filtered.sort((a, b) => {
        for (const [k, d] of Object.entries(sort)) {
          const av = k === 'createdAt' ? Date.parse(a[k]) : a[k],
            bv = k === 'createdAt' ? Date.parse(b[k]) : b[k];
          if (av < bv) return -d;
          if (av > bv) return d;
        }
        return 0;
      });
      return { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
    },
  };
  const authenticate = (req, res) => res.status(401).json(unavailable);
  app.use('/api/properties', propertyRouter(store, { authenticate }, {}));
  app.use((req, res) =>
    res.status(404).json({ message: 'Page not found in this browsing preview' }),
  );
  app.use((err, req, res, next) =>
    res
      .status(err.status || 500)
      .json({ message: err.status ? err.message : 'Preview temporarily unavailable' }),
  );
  return app;
}
