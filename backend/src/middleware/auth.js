import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Verify admin JWT from httpOnly cookie or `Authorization: Bearer` header.
 * On success sets req.user = { id, username, role }.
 */
export function requireAuth(req, _res, next) {
  const token =
    req.cookies?.[env.COOKIE_NAME] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return next(new AppError('UNAUTHENTICATED', 'Missing auth token', 401));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    return next();
  } catch (err) {
    return next(new AppError('INVALID_TOKEN', 'Token invalid or expired', 401));
  }
}

/**
 * Require one of the given roles. Use after requireAuth.
 * Example: router.delete('/x', requireAuth, requireRole('super_admin'), handler)
 */
export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('UNAUTHENTICATED', 'Auth required', 401));
    if (!allowed.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 'Insufficient role', 403));
    }
    return next();
  };
}

/**
 * Sign a JWT for an admin row.
 */
export function issueToken(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username, role: admin.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * Cookie options shared between login (set) and logout (clear).
 */
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    // maxAge is set on setCookie only; clearCookie ignores it
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  };
}
