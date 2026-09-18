import { AppError } from '../utils/AppError.js';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

/**
 * 404 handler — mount AFTER all routes.
 */
export function notFoundHandler(req, res, next) {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404));
}

/**
 * Global error handler — mount LAST.
 * Coerces every error into a uniform JSON envelope:
 *   { ok: false, error: { code, message, details? } }
 */
export function errorHandler(err, req, res, _next) {
  // Zod validation error → 422
  if (err instanceof ZodError) {
    return res.status(422).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
      },
    });
  }

  // Known application error
  if (err instanceof AppError) {
    return res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // MySQL duplicate key
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      ok: false,
      error: { code: 'DUPLICATE', message: 'Resource already exists' },
    });
  }

  // Unknown → 500
  // eslint-disable-next-line no-console
  console.error('[UNHANDLED]', err);
  return res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      ...(env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    },
  });
}
