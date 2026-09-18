import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * Shared MySQL connection pool.
 * - Uses promise API so services can await
 * - JSON columns come back as parsed objects (default in mysql2)
 * - timezone: '+07:00' → DATETIME columns are treated as Bangkok time
 * - decimalNumbers: true so DECIMAL(5,2) doesn't come as a string
 */
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  timezone: env.DB_TIMEZONE,
  charset: 'utf8mb4_unicode_ci',
  dateStrings: false,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
  namedPlaceholders: true,
  multipleStatements: false,
});

/**
 * Verify connectivity at startup — fail fast if DB is unreachable.
 */
export async function assertDbReady() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}

/**
 * Run a callback inside a transaction. Rolls back automatically on throw.
 * Caller receives the connection and MUST use it (not pool) for all queries.
 *
 * Usage:
 *   await withTransaction(async (conn) => {
 *     await conn.query('SELECT ... FOR UPDATE', [...]);
 *     await conn.query('INSERT ...', [...]);
 *   });
 */
export async function withTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
