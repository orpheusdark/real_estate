import { randomBytes } from 'node:crypto';
export function configuration(env = process.env) {
 const demo = env.DEMO_MODE === 'true';
 const production = env.NODE_ENV === 'production';
 if (production && demo) throw new Error('Demo mode is forbidden in production');
 if (!demo && (!env.MONGODB_URI || !env.JWT_SECRET || env.JWT_SECRET.length < 32)) throw new Error('Set MONGODB_URI and a JWT_SECRET of at least 32 characters, or explicitly enable DEMO_MODE locally');
 if (production && (!env.IMAGEKIT_PRIVATE_KEY || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM || !env.FRONTEND_URL?.startsWith('https://') || !env.PUBLIC_API_URL?.startsWith('https://'))) throw new Error('Production requires HTTPS origins, ImageKit and SMTP configuration');
 return { demo, production, secret: env.JWT_SECRET || randomBytes(48).toString('hex'), frontend: env.FRONTEND_URL || 'http://localhost:5173', api: env.PUBLIC_API_URL || 'http://localhost:4000', port: Number(env.PORT || 4000), dataDir: env.DATA_DIR || new URL('../data/', import.meta.url).pathname.replace(/^\/(.:)/, '$1'), uploadDir: env.UPLOAD_DIR || new URL('../uploads/', import.meta.url).pathname.replace(/^\/(.:)/, '$1'), trustProxy: env.TRUST_PROXY === '1' };
}
