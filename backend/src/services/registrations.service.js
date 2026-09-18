import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { upsertParticipantOnConn } from './participants.service.js';

/**
 * List registrations for a given activity (admin dashboard).
 * Joins participant so UI has name + contact without a second call.
 */
export async function listRegistrationsForActivity(activityId, { status } = {}) {
  const where = ['r.activity_id = ?'];
  const params = [activityId];
  if (status) { where.push('r.registration_status = ?'); params.push(status); }

  const [rows] = await pool.query(
    `SELECT r.id, r.registration_status, r.note, r.checked_in_at,
            r.registered_at, r.updated_at,
            p.id AS participant_id, p.first_name, p.last_name, p.email,
            p.phone, p.organization, p.position
       FROM registrations r
       JOIN participants  p ON p.id = r.participant_id
      WHERE ${where.join(' AND ')}
      ORDER BY r.registered_at DESC`,
    params
  );
  return rows;
}

/**
 * Register a participant for an activity. Enforces capacity check with
 * `SELECT ... FOR UPDATE` inside a transaction to prevent race conditions.
 *
 * `participantInput` = full participant fields (name, email, phone, org, position)
 * The participant is upsert'd by email.
 */
export async function registerForActivity(activityId, participantInput, note) {
  return withTransaction(async (conn) => {
    // Row-lock the activity + count current non-cancelled registrations.
    const [[activity]] = await conn.query(
      `SELECT id, capacity, status,
              (SELECT COUNT(*) FROM registrations
                WHERE activity_id = ?
                  AND registration_status <> 'cancelled') AS current_count
         FROM activities
        WHERE id = ?
        FOR UPDATE`,
      [activityId, activityId]
    );

    if (!activity) throw new AppError('NOT_FOUND', 'Activity not found', 404);

    if (activity.status !== 'published') {
      throw new AppError('ACTIVITY_NOT_OPEN',
        `Cannot register: activity status is "${activity.status}"`, 400);
    }

    if (activity.capacity > 0 && activity.current_count >= activity.capacity) {
      throw new AppError('OVER_CAPACITY',
        'This activity is fully booked', 409,
        { capacity: activity.capacity, current: activity.current_count });
    }

    // Upsert participant on the same connection so a rollback also rolls back
    // participant edits. Shared helper guarantees phone is normalized.
    const participantId = await upsertParticipantOnConn(conn, participantInput);

    // Attempt the registration insert
    try {
      const [rRes] = await conn.query(
        `INSERT INTO registrations
           (activity_id, participant_id, registration_status, note)
         VALUES (?, ?, 'pending', ?)`,
        [activityId, participantId, note ?? null]
      );
      return { registration_id: rRes.insertId, participant_id: participantId };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError('DUPLICATE_REGISTRATION',
          'This participant is already registered for this activity', 409);
      }
      throw err;
    }
  });
}

/**
 * Change a registration status (approve / reject / mark attended / cancel).
 * Called by admin from the registrants page.
 */
export async function updateRegistrationStatus(id, newStatus, extra = {}) {
  const allowed = ['pending', 'confirmed', 'attended', 'cancelled'];
  if (!allowed.includes(newStatus)) {
    throw new AppError('INVALID_STATUS', `Status must be one of ${allowed.join(', ')}`, 400);
  }

  const fields = ['registration_status = ?'];
  const params = [newStatus];
  if (newStatus === 'attended') {
    fields.push('checked_in_at = COALESCE(checked_in_at, NOW())');
  }
  if (extra.note !== undefined) {
    fields.push('note = ?');
    params.push(extra.note);
  }
  params.push(id);

  const [result] = await pool.query(
    `UPDATE registrations SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Registration not found', 404);
  return getRegistrationById(id);
}

export async function getRegistrationById(id) {
  const [rows] = await pool.query(
    `SELECT r.*, p.first_name, p.last_name, p.email, p.phone,
            a.slug AS activity_slug, a.title AS activity_title
       FROM registrations r
       JOIN participants p ON p.id = r.participant_id
       JOIN activities   a ON a.id = r.activity_id
      WHERE r.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function deleteRegistration(id) {
  const [result] = await pool.query('DELETE FROM registrations WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Registration not found', 404);
  return { id };
}
