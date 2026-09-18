import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

/**
 * Verify username + password against `admins`. Returns the admin row (minus hash).
 * Also updates last_login_at on success.
 */
export async function authenticate(username, password) {
  const [rows] = await pool.query(
    `SELECT id, username, password_hash, first_name, last_name, email, role, is_active
       FROM admins WHERE username = ? LIMIT 1`,
    [username]
  );
  const admin = rows[0];
  if (!admin || !admin.is_active) {
    // Same error for both cases so attackers can't enumerate users
    throw new AppError('INVALID_CREDENTIALS', 'Username or password incorrect', 401);
  }

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) throw new AppError('INVALID_CREDENTIALS', 'Username or password incorrect', 401);

  // Update last login (fire-and-forget style but await to keep pool cleanup deterministic)
  await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);

  const { password_hash: _drop, ...safe } = admin;
  return safe;
}

/**
 * Fetch admin by id (for /auth/me).
 */
export async function findAdminById(id) {
  const [rows] = await pool.query(
    `SELECT id, username, first_name, last_name, email, role, is_active, last_login_at
       FROM admins WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}
