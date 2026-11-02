import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { authTools, authRouter, publicUser } from './auth.js';
import { propertyRouter, publicProperty } from './properties.js';
import { appointmentRouter, publicAppointment } from './appointments.js';
import { createMailer } from './mail.js';
import { imageService } from './images.js';
import { fail } from './validation.js';
export function createApp(store, config) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' },contentSecurityPolicy:{directives:{imgSrc:["'self'",'https:','data:','blob:'],scriptSrc:["'self'"],connectSrc:["'self'"],objectSrc:["'none'"],upgradeInsecureRequests:config.production?[]:null}} }));
  const origins = new Set([
    config.frontend,
    ...(config.demo ? ['http://127.0.0.1:5173', 'http://localhost:5173'] : []),
  ]);
  app.use(
    cors({ origin: (origin, cb) => cb(null, !origin || origins.has(origin)), credentials: true }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      if (
        (origin && !origins.has(origin)) ||
        (req.cookies.session && !origin && !req.get('authorization'))
      )
        return next(Object.assign(new Error('Request origin is not allowed'), { status: 403 }));
    }
    next();
  });
  const limiter = (limit, windowMs = 15 * 60000) =>
    rateLimit({
      windowMs,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { message: 'Too many requests. Please try again later.' },
    });
  app.use('/api', limiter(300));
  app.use('/api/auth', limiter(30));
  app.use('/api/appointments/manage', limiter(40));
  app.use(/^\/api\/properties\/[^/]+\/appointments/, limiter(15));
  app.use(
    '/uploads',
    express.static(config.uploadDir, {
      dotfiles: 'deny',
      maxAge: '1d',
      setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
    }),
  );
  const auth = authTools(store, config),
    mail = createMailer(config),
    images = imageService(config);
  app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', mode: config.demo ? 'demo' : 'connected' }),
  );
  app.use('/api/auth', authRouter(store, config, mail, auth));
  app.get('/api/users/me', auth.authenticate, (req, res) => res.json(publicUser(req.user)));
  app.get('/api/dashboard', auth.authenticate, async (req, res) => {
    const listings = await store.find('properties', { ownerId: req.user._id, archived: false });
    const mine = await store.find('appointments', { userId: req.user._id });
    const incoming = await store.find('appointments', { ownerId: req.user._id });
    res.json({
      listings: listings.map(publicProperty),
      appointments: mine.map(publicAppointment),
      incoming: incoming.map(publicAppointment),
    });
  });
  app.use('/api/properties', propertyRouter(store, auth, images));
  app.use('/api', appointmentRouter(store, auth, mail, config));
  app.get('/robots.txt', (req, res) =>
    res
      .type('text')
      .send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${config.api}/sitemap.xml`),
  );
  app.get('/sitemap.xml', async (req, res) => {
    const rows = await store.find('properties', { archived: false });
    const urls = ['', '/properties', ...rows.map((p) => '/properties/' + p._id)];
    res
      .type('xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((p) => `<url><loc>${config.frontend.replaceAll('&', '&amp;')}${p}</loc></url>`).join('')}</urlset>`,
      );
  });
  const webDir = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
  if (existsSync(path.join(webDir, 'index.html'))) {
    app.use(express.static(webDir, { index: false }));
    app.get(/^(?!\/api(?:\/|$)|\/uploads(?:\/|$)).*/, async (req, res) => {
      let html = readFileSync(path.join(webDir, 'index.html'), 'utf8');
      const escape = (s) =>
        s
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;');
      const match = req.path.match(/^\/properties\/([a-f0-9-]{36})$/);
      let status = 200;
      if (match) {
        const p = await store.one('properties', { _id: match[1], archived: false });
        if (p) {
          html = html
            .replace(
              /<title>.*?<\/title>/,
              `<title>${escape(p.title + ' in ' + p.location)} | EstateIQ</title>`,
            )
            .replace(
              /<meta name="description" content="[^"]*"\s*\/>/,
              `<meta name="description" content="${escape(p.description.slice(0, 160))}"/>`,
            );
          html = html.replace(
            '</head>',
            `<meta property="og:title" content="${escape(p.title)}"/><meta property="og:description" content="${escape(p.description.slice(0, 160))}"/><link rel="canonical" href="${escape(config.frontend + req.path)}"/>${p.images[0] ? `<meta property="og:image" content="${escape(p.images[0].url)}"/>` : ''}</head>`,
          );
        } else {
          status = 404;
        }
      }
      if (
        /^\/(dashboard|login|register|forgot-password|reset-password|viewing)(\/|$)/.test(
          req.path,
        ) ||
        req.path.endsWith('/edit') ||
        req.path === '/properties/new'
      )
        html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow"/></head>');
      if (
        !match &&
        ![
          '/',
          '/properties',
          '/dashboard',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/viewing',
          '/properties/new',
        ].includes(req.path) &&
        !/^\/properties\/[a-f0-9-]{36}\/edit$/.test(req.path)
      )
        status = 404;
      res.status(status).type('html').send(html);
    });
  }
  app.use((req, res) => res.status(404).json({ message: 'This route does not exist' }));
  app.use((err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message;
    if (err.code === 11000) {
      status = 409;
      message = 'That email or viewing time is already taken';
    }
    if (err.name === 'MulterError') {
      status = 400;
      message = 'Upload up to four images, maximum 5 MB each';
    }
    if (status >= 500) {
      console.error('Request failed:', err.name);
      message = 'Something went wrong. Please try again.';
    }
    res.status(status).json({ message });
  });
  return app;
}
