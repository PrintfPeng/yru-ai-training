import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { upsertParticipantOnConn } from './participants.service.js';
import { normalizePhone } from '../utils/slugify.js';

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
 * Public list of registrants for an activity (shown on the registration page
 * so applicants can confirm their sign-up). Names are masked: full first name
 * + first 4 chars of the last name + "*****". Only approved/attended rows.
 */
export async function listPublicRegistrants(activitySlug) {
  const [rows] = await pool.query(
    `SELECT p.first_name, p.last_name
       FROM registrations r
       JOIN participants  p ON p.id = r.participant_id
       JOIN activities    a ON a.id = r.activity_id
      WHERE a.slug = ?
        AND r.registration_status IN ('confirmed', 'attended')
      ORDER BY r.registered_at ASC`,
    [activitySlug]
  );
  const maskLast = (ln) => `${String(ln || '').slice(0, 4)}*****`;
  return rows.map((r) => ({
    first_name: r.first_name,
    last_name_masked: maskLast(r.last_name),
  }));
}

/* ---------- register helpers (shared by individual + team) ---------- */

// Row-lock the activity and check it's open + has room for `seatsNeeded` more.
async function lockActivityForRegister(conn, activityId, seatsNeeded) {
  const [[activity]] = await conn.query(
    `SELECT id, capacity, status, registration_type, team_max_members,
            -- Stored datetimes use a Buddhist-era year (literal, see
            -- src/utils/thaiDate.js), so shift NOW() by +543 years before comparing.
            (register_open_at    IS NOT NULL AND DATE_ADD(NOW(), INTERVAL 543 YEAR) < register_open_at)    AS not_open_yet,
            (register_close_date IS NOT NULL AND DATE_ADD(NOW(), INTERVAL 543 YEAR) > register_close_date) AS closed,
            (SELECT COUNT(*) FROM registrations
              WHERE activity_id = ? AND registration_status <> 'cancelled') AS current_count
       FROM activities WHERE id = ? FOR UPDATE`,
    [activityId, activityId]
  );
  if (!activity) throw new AppError('NOT_FOUND', 'Activity not found', 404);
  if (activity.status !== 'published') {
    throw new AppError('ACTIVITY_NOT_OPEN',
      `Cannot register: activity status is "${activity.status}"`, 400);
  }
  // Registration window (compared in the DB session timezone against stored
  // wall-clock values, so no JS timezone drift).
  if (activity.not_open_yet) {
    throw new AppError('REGISTRATION_NOT_OPEN', 'ยังไม่ถึงเวลาเปิดรับสมัคร', 400);
  }
  if (activity.closed) {
    throw new AppError('REGISTRATION_CLOSED', 'ปิดรับสมัครแล้ว', 400);
  }
  if (activity.capacity > 0 && activity.current_count + seatsNeeded > activity.capacity) {
    throw new AppError('OVER_CAPACITY', 'This activity is fully booked', 409,
      { capacity: activity.capacity, current: activity.current_count });
  }
  return activity;
}

// Normalize + require a 10-digit phone.
function require10DigitPhone(raw) {
  const p = normalizePhone(raw);
  if (p.length !== 10) {
    throw new AppError('INVALID_PHONE', `เบอร์โทรต้องมี 10 หลัก: "${raw}"`, 422, { phone: raw });
  }
  return p;
}

// Reject if any phone already registered (non-cancelled) in this activity.
async function assertPhonesAvailable(conn, activityId, phones) {
  for (const phone of phones) {
    const [[hit]] = await conn.query(
      `SELECT 1 AS x FROM registrations r
         JOIN participants p ON p.id = r.participant_id
        WHERE r.activity_id = ? AND p.phone = ?
          AND r.registration_status <> 'cancelled' LIMIT 1`,
      [activityId, phone]
    );
    if (hit) {
      throw new AppError('DUPLICATE_PHONE',
        `เบอร์ ${phone} ถูกใช้ลงทะเบียนกิจกรรมนี้แล้ว`, 409, { phone });
    }
  }
}

// Insert one registration row (auto-confirmed) + optional team + form data.
async function insertRegistration(conn, activityId, participantId, { note, teamId, formData }) {
  try {
    const [r] = await conn.query(
      `INSERT INTO registrations
         (activity_id, participant_id, registration_status, note, team_id, form_data)
       VALUES (?, ?, 'confirmed', ?, ?, CAST(? AS JSON))`,
      [activityId, participantId, note ?? null, teamId ?? null, JSON.stringify(formData ?? null)]
    );
    return r.insertId;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('DUPLICATE_REGISTRATION',
        'This participant is already registered for this activity', 409);
    }
    throw err;
  }
}

/**
 * Individual registration. `participantInput` = { prefix, first_name, last_name,
 * email, phone, organization?, position? }. `formData` = full submitted answers.
 */
export async function registerForActivity(activityId, participantInput, note, formData = null) {
  return withTransaction(async (conn) => {
    await lockActivityForRegister(conn, activityId, 1);
    const phone = require10DigitPhone(participantInput.phone);
    await assertPhonesAvailable(conn, activityId, [phone]);
    const participantId = await upsertParticipantOnConn(conn, { ...participantInput, phone });
    const registration_id = await insertRegistration(conn, activityId, participantId,
      { note, teamId: null, formData: formData ?? participantInput });
    return { registration_id, participant_id: participantId };
  });
}

/**
 * Team registration. Body: { team_name, members: [{prefix, first_name,
 * last_name, email, phone, ...}], note? }. Each member becomes its own
 * participant + registration linked to the new team (so each verifies by
 * their own phone and gets their own certificate).
 */
export async function registerTeamForActivity(activityId, { team_name, members, note }) {
  return withTransaction(async (conn) => {
    if (!team_name || !team_name.trim()) {
      throw new AppError('TEAM_NAME_REQUIRED', 'กรุณาระบุชื่อทีม', 422);
    }
    if (!Array.isArray(members) || members.length < 1) {
      throw new AppError('NO_MEMBERS', 'ต้องมีสมาชิกอย่างน้อย 1 คน', 422);
    }

    const activity = await lockActivityForRegister(conn, activityId, members.length);
    if (activity.registration_type !== 'team') {
      throw new AppError('NOT_TEAM_ACTIVITY', 'กิจกรรมนี้ไม่ได้เปิดรับแบบทีม', 400);
    }
    if (members.length > activity.team_max_members) {
      throw new AppError('TOO_MANY_MEMBERS',
        `เกินจำนวนสมาชิกสูงสุด (${activity.team_max_members} คน)`, 422);
    }

    // phones: 10 digits, no dup within the team, not already in the activity
    const phones = members.map((m) => require10DigitPhone(m.phone));
    const dup = phones.find((p, i) => phones.indexOf(p) !== i);
    if (dup) {
      throw new AppError('DUPLICATE_PHONE_IN_TEAM', `เบอร์ซ้ำกันในทีม: ${dup}`, 422, { phone: dup });
    }
    await assertPhonesAvailable(conn, activityId, phones);

    const [tRes] = await conn.query(
      'INSERT INTO teams (activity_id, team_name) VALUES (?, ?)',
      [activityId, team_name.trim()]
    );
    const team_id = tRes.insertId;

    const out = [];
    for (let i = 0; i < members.length; i++) {
      const participantId = await upsertParticipantOnConn(conn, { ...members[i], phone: phones[i] });
      const registration_id = await insertRegistration(conn, activityId, participantId,
        { note, teamId: team_id, formData: members[i] });
      out.push({ registration_id, participant_id: participantId });
    }
    return { team_id, team_name: team_name.trim(), members: out };
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
