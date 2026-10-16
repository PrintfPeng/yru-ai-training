import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

/**
 * ผลงานที่ผ่านมา (Past Works). Image is stored as http(s) URL or data:image
 * base64 in a LONGTEXT column (same approach as activities.cover_image_url).
 */

const COLUMNS =
  'id, title, description, image_url, display_order, is_active, created_at, updated_at';

/**
 * ดึงรายการผลงานทั้งหมด เรียงตาม display_order ASC แล้ว created_at DESC.
 * โดย default คืนเฉพาะที่ is_active = 1 (สำหรับหน้าเว็บสาธารณะ); ส่ง
 * includeInactive = true เพื่อดึงทั้งหมด (สำหรับหน้าจัดการของแอดมิน).
 */
export async function getAllPortfolios({ includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS}
       FROM portfolios
      ${includeInactive ? '' : 'WHERE is_active = 1'}
      ORDER BY display_order ASC, created_at DESC`
  );
  return rows;
}

export async function getPortfolioById(id) {
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM portfolios WHERE id = ? LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);
  return row;
}

export async function createPortfolio(input) {
  const [result] = await pool.query(
    `INSERT INTO portfolios (title, description, image_url, display_order, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.title,
      input.description,
      input.image_url,
      input.display_order ?? 0,
      input.is_active === undefined ? 1 : (input.is_active ? 1 : 0),
    ]
  );
  return getPortfolioById(result.insertId);
}

export async function updatePortfolio(id, patch) {
  const allowed = ['title', 'description', 'image_url', 'display_order', 'is_active'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    if (key === 'is_active') {
      sets.push('is_active = ?');
      params.push(patch.is_active ? 1 : 0);
    } else {
      sets.push(`${key} = ?`);
      params.push(patch[key]);
    }
  }
  if (!sets.length) return getPortfolioById(id);
  params.push(id);
  const [result] = await pool.query(
    `UPDATE portfolios SET ${sets.join(', ')} WHERE id = ?`,
    params
  );
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);
  return getPortfolioById(id);
}

export async function deletePortfolio(id) {
  const [result] = await pool.query('DELETE FROM portfolios WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);
  return { id };
}
