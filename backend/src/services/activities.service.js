import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';

/**
 * List activities with summary numbers (uses v_activity_summary VIEW).
 * Supports filtering by status and simple pagination.
 */
export async function listActivities({ status, limit = 50, offset = 0 }) {
  const where = [];
  const params = [];
  if (status) { where.push('a.status = ?'); params.push(status); }

  const [rows] = await pool.query(
    `SELECT a.id, a.title, a.slug, a.description, a.location,
            a.start_date, a.end_date, a.capacity, a.status,
            a.cover_image_url, a.created_by,
            a.batch_no, a.title_en, a.register_close_date, a.has_selection,
            a.fee_text, a.travel_text, a.venue_links, a.note_text,
            a.registration_type, a.team_max_members, a.team_cert_mode, a.register_form_schema,
            s.total_registered, s.total_attended, s.total_confirmed,
            s.total_pending, s.seats_left,
            a.created_at, a.updated_at
       FROM activities a
       LEFT JOIN v_activity_summary s ON s.activity_id = a.id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY a.start_date DESC
       LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

export async function getActivityBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT a.*, s.total_registered, s.total_attended, s.seats_left
       FROM activities a
       LEFT JOIN v_activity_summary s ON s.activity_id = a.id
      WHERE a.slug = ? LIMIT 1`,
    [slug]
  );
  const row = rows[0];
  if (!row) throw new AppError('NOT_FOUND', 'Activity not found', 404);
  return row;
}

export async function getActivityById(id) {
  const [rows] = await pool.query(
    `SELECT a.*, s.total_registered, s.total_attended, s.seats_left
       FROM activities a
       LEFT JOIN v_activity_summary s ON s.activity_id = a.id
      WHERE a.id = ? LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) throw new AppError('NOT_FOUND', 'Activity not found', 404);
  return row;
}

export async function createActivity(input, adminId) {
  const slug = input.slug?.trim() || slugify(input.title);
  if (!slug) throw new AppError('INVALID_SLUG', 'Cannot derive slug from title', 400);

  try {
    const [result] = await pool.query(
      `INSERT INTO activities
         (title, slug, description, location, start_date, end_date,
          capacity, status, cover_image_url, created_by,
          batch_no, title_en, register_close_date, has_selection,
          fee_text, travel_text, venue_links, note_text,
          registration_type, team_max_members, team_cert_mode, register_form_schema)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?,
               ?, ?, ?, CAST(? AS JSON))`,
      [
        input.title,
        slug,
        input.description ?? null,
        input.location ?? null,
        input.start_date,
        input.end_date,
        input.capacity ?? 0,
        input.status ?? 'draft',
        input.cover_image_url ?? null,
        adminId,
        input.batch_no ?? null,
        input.title_en ?? null,
        input.register_close_date ?? null,
        input.has_selection ? 1 : 0,
        input.fee_text ?? null,
        input.travel_text ?? null,
        JSON.stringify(input.venue_links ?? []),
        input.note_text ?? null,
        input.registration_type ?? 'individual',
        input.team_max_members ?? 5,
        input.team_cert_mode ?? null,
        JSON.stringify(input.register_form_schema ?? null),
      ]
    );
    return getActivityById(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('DUPLICATE_SLUG', `Slug "${slug}" already exists`, 409);
    }
    throw err;
  }
}

export async function updateActivity(id, patch) {
  const allowed = ['title', 'description', 'location', 'start_date', 'end_date',
                   'capacity', 'status', 'cover_image_url',
                   'batch_no', 'title_en', 'register_close_date', 'has_selection',
                   'fee_text', 'travel_text', 'venue_links', 'note_text',
                   'registration_type', 'team_max_members', 'team_cert_mode',
                   'register_form_schema'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      if (key === 'venue_links') {
        sets.push('venue_links = CAST(? AS JSON)');
        params.push(JSON.stringify(patch.venue_links ?? []));
      } else if (key === 'register_form_schema') {
        sets.push('register_form_schema = CAST(? AS JSON)');
        params.push(JSON.stringify(patch.register_form_schema ?? null));
      } else if (key === 'has_selection') {
        sets.push('has_selection = ?');
        params.push(patch.has_selection ? 1 : 0);
      } else {
        sets.push(`${key} = ?`);
        params.push(patch[key]);
      }
    }
  }
  if (!sets.length) return getActivityById(id);
  params.push(id);
  await pool.query(`UPDATE activities SET ${sets.join(', ')} WHERE id = ?`, params);
  return getActivityById(id);
}

export async function deleteActivity(id) {
  const [result] = await pool.query('DELETE FROM activities WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Activity not found', 404);
  return { id };
}
