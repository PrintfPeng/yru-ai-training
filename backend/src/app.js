import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/src/app.js  →  ../../dist (frontend build output at repo root)
const DIST_DIR = path.resolve(__dirname, '../../dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const FRONTEND_READY = fs.existsSync(DIST_INDEX);

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Only trust proxy headers when explicitly configured (nginx in front).
  // When TRUST_PROXY is false, req.ip comes from socket.remoteAddress
  // directly so express-rate-limit can't be fooled by client-set
  // X-Forwarded-For headers on a bare-metal run.
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({
    origin: (origin, cb) => {
      // Allow same-origin (no Origin header) and whitelisted origins
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,                   // needed for httpOnly cookies
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }));

  app.use(express.json({ limit: '2mb' })); // JSON body up to 2 MB
  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Mount everything under /api
  app.use('/api', routes);

  // Serve built frontend (same-origin) — only if dist/ exists at boot.
  // Any non-/api GET falls back to index.html so the SPA router can handle it.
  if (FRONTEND_READY) {
    app.use(express.static(DIST_DIR, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api/')) return next();
      return res.sendFile(DIST_INDEX);
    });
  }

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { FRONTEND_READY, DIST_DIR };
