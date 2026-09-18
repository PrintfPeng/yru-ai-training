import 'dotenv/config';
import { z } from 'zod';

/**
 * Parse "true" / "1" as true; everything else (including "false" and undefined)
 * as false. z.coerce.boolean is unusable for env parsing because it applies
 * JS Boolean() which treats any non-empty string as true.
 */
const boolFromEnv = (defaultVal = false) =>
  z.union([z.string(), z.boolean(), z.undefined()])
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      if (v === undefined) return defaultVal;
      const s = String(v).trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'yes' || s === 'on';
    });

// Fail fast on startup if a required env var is missing or wrong shape.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_TIMEZONE: z.string().default('+07:00'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be >= 32 chars'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_NAME: z.string().default('yru_admin_token'),
  COOKIE_SECURE: boolFromEnv(false),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(10),

  // Set true only behind a reverse proxy you own (nginx). If false, the
  // rate limiter keys by socket.remoteAddress and can't be fooled by
  // client-supplied X-Forwarded-For.
  TRUST_PROXY: boolFromEnv(false),

  PUBLIC_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  PUBLIC_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
});
