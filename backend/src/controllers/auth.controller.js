import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { authenticate, findAdminById } from '../services/auth.service.js';
import { issueToken, cookieOptions } from '../middleware/auth.js';

export const login = asyncHandler(async (req, res) => {
  const admin = await authenticate(req.body.username, req.body.password);
  const token = issueToken(admin);
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
  res.json({ ok: true, data: { admin } });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const admin = await findAdminById(req.user.id);
  res.json({ ok: true, data: { admin } });
});
