import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';

/**
 * หมวดหมู่กิจกรรม. Activities ↔ categories is many-to-many through
 * activity_categories. Public pages link to /?view=training&cat=<slug>.
 */

// Statuses an activity must be in to show on the public site (same set the
// public training page lists).
const PUBLIC_STATUSES = ['published', 'assessment'];

/**
 * ดึงหมวดหมู่ทั้งหมด เรียงตาม display_order ASC แล้ว name ASC.
 * Public (default): เฉพาะ is_active = 1, activity_count นับเฉพาะกิจกรรมที่แสดงหน้าเว็บ.
 * Admin (includeInactive): ทุกหมวด, activity_count นับกิจกรรมทุกสถานะ.
 */
export async function getAllCategories({ includeInactive = false } = {}) {
  const countJoin = includeInactive
    ? 'LEFT JOIN activities a ON a.id = ac.activity_id'
    : `LEFT JOIN activities a ON a.id = ac.activity_id AND a.status IN (${PUBLIC_STATUSES.map(() => '?').join(', ')})`;
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.description, c.display_order, c.is_active,
            c.created_at, c.updated_at,
            COUNT(a.id) AS activity_count
       FROM categories c
       LEFT JOIN activity_categories ac ON ac.category_id = c.id
       ${countJoin}
      ${includeInactive ? '' : 'WHERE c.is_active = 1'}
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC`,
    includeInactive ? [] : PUBLIC_STATUSES
  );
  return rows;
}

export async function getCategoryById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, slug, description, display_order, is_active, created_at, updated_at
       FROM categories WHERE id = ? LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) throw new AppError('NOT_FOUND', 'Category not found', 404);
  return row;
}

const dupSlug = (err, slug) => {
  if (err.code === 'ER_DUP_ENTRY') {
    return new AppError('DUPLICATE_SLUG', `Slug "${slug}" already exists`, 409);
  }
  return err;
};

export async function createCategory(input) {
  const slug = slugify(input.slug?.trim() || input.name);
  if (!slug) throw new AppError('INVALID_SLUG', 'Cannot derive slug from name', 400);
  try {
    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, display_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.name.trim(),
        slug,
        input.description?.trim() || null,
        input.display_order ?? 0,
        input.is_active === undefined ? 1 : (input.is_active ? 1 : 0),
      ]
    );
    return getCategoryById(result.insertId);
  } catch (err) {
    throw dupSlug(err, slug);
  }
}

export async function updateCategory(id, patch) {
  const sets = [];
  const params = [];
  if (patch.name !== undefined)          { sets.push('name = ?');          params.push(patch.name.trim()); }
  if (patch.slug !== undefined) {
    const slug = slugify(patch.slug);
    if (!slug) throw new AppError('INVALID_SLUG', 'Invalid slug', 400);
    sets.push('slug = ?'); params.push(slug);
  }
  if (patch.description !== undefined)   { sets.push('description = ?');   params.push(patch.description?.trim() || null); }
  if (patch.display_order !== undefined) { sets.push('display_order = ?'); params.push(patch.display_order); }
  if (patch.is_active !== undefined)     { sets.push('is_active = ?');     params.push(patch.is_active ? 1 : 0); }
  if (!sets.length) return getCategoryById(id);
  params.push(id);
  try {
    const [result] = await pool.query(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Category not found', 404);
  } catch (err) {
    throw dupSlug(err, patch.slug);
  }
  return getCategoryById(id);
}

/** ลบหมวดหมู่ — ความเชื่อมโยงกับกิจกรรมถูกลบตาม (ON DELETE CASCADE), ตัวกิจกรรมไม่ถูกลบ. */
export async function deleteCategory(id) {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Category not found', 404);
  return { id };
}

/* ---------- activity ↔ category helpers (used by activities.service) ---------- */

/**
 * Map of activityId → [{ id, name, slug }] for the given activities.
 */
export async function getCategoriesForActivities(activityIds) {
  const map = new Map();
  if (!activityIds.length) return map;
  const [rows] = await pool.query(
    `SELECT ac.activity_id, c.id, c.name, c.slug
       FROM activity_categories ac
       JOIN categories c ON c.id = ac.category_id
      WHERE ac.activity_id IN (?)
      ORDER BY c.display_order ASC, c.name ASC`,
    [activityIds]
  );
  for (const r of rows) {
    if (!map.has(r.activity_id)) map.set(r.activity_id, []);
    map.get(r.activity_id).push({ id: r.id, name: r.name, slug: r.slug });
  }
  return map;
}

/** Throw 400 unless every id in `categoryIds` exists. */
export async function assertCategoriesExist(categoryIds) {
  const ids = [...new Set(categoryIds)];
  if (!ids.length) return;
  const [rows] = await pool.query('SELECT id FROM categories WHERE id IN (?)', [ids]);
  if (rows.length !== ids.length) {
    throw new AppError('INVALID_CATEGORY', 'One or more categories do not exist', 400);
  }
}

/** Replace an activity's categories with exactly `categoryIds`. */
export async function setActivityCategories(activityId, categoryIds) {
  const ids = [...new Set(categoryIds)];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM activity_categories WHERE activity_id = ?', [activityId]);
    if (ids.length) {
      await conn.query(
        'INSERT INTO activity_categories (activity_id, category_id) VALUES ?',
        [ids.map((cid) => [activityId, cid])]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new AppError('INVALID_CATEGORY', 'One or more categories do not exist', 400);
    }
    throw err;
  } finally {
    conn.release();
  }
}
