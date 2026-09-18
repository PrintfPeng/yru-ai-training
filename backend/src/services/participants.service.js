import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { normalizePhone } from '../utils/slugify.js';

export async function listParticipants({ q, limit = 50, offset = 0 }) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, phone, organization, position,
            created_at, updated_at
       FROM participants
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

export async function getParticipantById(id) {
  const [rows] = await pool.query('SELECT * FROM participants WHERE id = ? LIMIT 1', [id]);
  const row = rows[0];
  if (!row) throw new AppError('NOT_FOUND', 'Participant not found', 404);
  return row;
}

/**
 * Look up participant by phone number, scoped to an activity slug.
 * Returns null if not registered — the controller decides the response shape.
 * Used by the trainee QR flow (EventLanding → verify phone).
 */
export async function findParticipantByPhoneAndActivity(phone, activitySlug) {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length !== 10) return null;

  const [rows] = await pool.query(
    `SELECT p.id, p.first_name, p.last_name, p.email, p.phone,
            p.organization, p.position,
            r.id AS registration_id, r.registration_status
       FROM participants  p
       JOIN registrations r ON r.participant_id = p.id
       JOIN activities    a ON a.id = r.activity_id
      WHERE a.slug = ?
        AND p.phone = ?
        AND r.registration_status IN ('confirmed', 'attended')
      LIMIT 1`,
    [activitySlug, normalized]
  );
  return rows[0] || null;
}

/**
 * Upsert participant on a specific connection (or the pool by default).
 * Single source of truth for the "find-by-email → update or insert" pattern.
 * ALWAYS normalizes phone before writing so downstream verify-by-phone works.
 * Returns the participant id (the row is guaranteed to exist after this call).
 */
export async function upsertParticipantOnConn(conn, input) {
  const phone = normalizePhone(input.phone);
  const [existing] = await conn.query(
    'SELECT id FROM participants WHERE email = ? LIMIT 1',
    [input.email]
  );
  if (existing[0]) {
    await conn.query(
      `UPDATE participants
          SET first_name = ?, last_name = ?, phone = ?,
              organization = ?, position = ?
        WHERE id = ?`,
      [
        input.first_name, input.last_name, phone,
        input.organization ?? null, input.position ?? null,
        existing[0].id,
      ]
    );
    return existing[0].id;
  }
  const [result] = await conn.query(
    `INSERT INTO participants
       (first_name, last_name, email, phone, organization, position)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.first_name, input.last_name, input.email, phone,
      input.organization ?? null, input.position ?? null,
    ]
  );
  return result.insertId;
}

/** Convenience wrapper: upsert via the shared pool and return the full row. */
export async function upsertParticipant(input) {
  const id = await upsertParticipantOnConn(pool, input);
  return getParticipantById(id);
}

export async function updateParticipant(id, patch) {
  const allowed = ['first_name', 'last_name', 'email', 'phone', 'organization', 'position'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(key === 'phone' ? normalizePhone(patch[key]) : patch[key]);
    }
  }
  if (!sets.length) return getParticipantById(id);
  params.push(id);
  try {
    await pool.query(`UPDATE participants SET ${sets.join(', ')} WHERE id = ?`, params);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('DUPLICATE_EMAIL', 'Email already used', 409);
    }
    throw err;
  }
  return getParticipantById(id);
}

export async function deleteParticipant(id) {
  const [result] = await pool.query('DELETE FROM participants WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Participant not found', 404);
  return { id };
}
