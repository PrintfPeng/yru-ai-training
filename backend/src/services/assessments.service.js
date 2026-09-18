import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { issueCertificateForRegistration } from './certificates.service.js';
import { getActivityById } from './activities.service.js';

/**
 * Admin CRUD
 */
export async function listAssessmentsForActivity(activityId) {
  const [rows] = await pool.query(
    `SELECT id, activity_id, title, description, type, form_schema,
            is_published, open_at, close_at, created_at, updated_at
       FROM assessments
      WHERE activity_id = ?
      ORDER BY created_at DESC`,
    [activityId]
  );
  return rows;
}

export async function getAssessmentById(id) {
  const [rows] = await pool.query('SELECT * FROM assessments WHERE id = ? LIMIT 1', [id]);
  const row = rows[0];
  if (!row) throw new AppError('NOT_FOUND', 'Assessment not found', 404);
  return row;
}

/**
 * Return the ACTIVE assessment for an activity slug (used by trainee flow).
 * "Active" = is_published AND (open_at is null OR now >= open_at)
 *                       AND (close_at is null OR now <= close_at)
 */
export async function getActiveAssessmentBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT s.id, s.activity_id, s.title, s.description, s.type, s.form_schema,
            s.open_at, s.close_at
       FROM assessments s
       JOIN activities  a ON a.id = s.activity_id
      WHERE a.slug = ?
        AND s.is_published = 1
        AND (s.open_at  IS NULL OR NOW() >= s.open_at)
        AND (s.close_at IS NULL OR NOW() <= s.close_at)
      ORDER BY s.created_at DESC
      LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export async function createAssessment(activityId, input) {
  // Return a proper 404 up-front instead of letting a FK violation surface as 500.
  await getActivityById(activityId);

  // Basic form_schema shape check (DB CHECK already enforces .fields is array)
  if (!input.form_schema || !Array.isArray(input.form_schema.fields)) {
    throw new AppError('INVALID_FORM_SCHEMA', 'form_schema.fields must be an array', 400);
  }
  const [result] = await pool.query(
    `INSERT INTO assessments
       (activity_id, title, description, type, form_schema,
        is_published, open_at, close_at)
     VALUES (?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?)`,
    [
      activityId, input.title, input.description ?? null,
      input.type ?? 'satisfaction',
      JSON.stringify(input.form_schema),
      input.is_published ? 1 : 0,
      input.open_at ?? null, input.close_at ?? null,
    ]
  );
  return getAssessmentById(result.insertId);
}

export async function updateAssessment(id, patch) {
  const sets = [];
  const params = [];
  for (const key of ['title', 'description', 'type', 'is_published', 'open_at', 'close_at']) {
    if (patch[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(key === 'is_published' ? (patch[key] ? 1 : 0) : patch[key]);
    }
  }
  if (patch.form_schema !== undefined) {
    if (!Array.isArray(patch.form_schema?.fields)) {
      throw new AppError('INVALID_FORM_SCHEMA', 'form_schema.fields must be an array', 400);
    }
    sets.push('form_schema = CAST(? AS JSON)');
    params.push(JSON.stringify(patch.form_schema));
  }
  if (!sets.length) return getAssessmentById(id);
  params.push(id);
  await pool.query(`UPDATE assessments SET ${sets.join(', ')} WHERE id = ?`, params);
  return getAssessmentById(id);
}

export async function deleteAssessment(id) {
  const [result] = await pool.query('DELETE FROM assessments WHERE id = ?', [id]);
  if (!result.affectedRows) throw new AppError('NOT_FOUND', 'Assessment not found', 404);
  return { id };
}

/**
 * Submit a response. Enforces:
 *   - assessment is published + within window
 *   - participant is registered (confirmed/attended) for the activity
 *   - required fields are present
 *   - only 1 response per (assessment, participant) — DB UNIQUE key
 *
 * On success, ALSO issues a certificate for that registration (if not exists).
 * Wrapped in one transaction so response + cert land together.
 */
export async function submitResponse({ assessmentId, participantId, responseData }) {
  return withTransaction(async (conn) => {
    // Load assessment + validate window
    const [[assessment]] = await conn.query(
      `SELECT id, activity_id, form_schema, is_published, open_at, close_at
         FROM assessments WHERE id = ? LIMIT 1`,
      [assessmentId]
    );
    if (!assessment) throw new AppError('NOT_FOUND', 'Assessment not found', 404);
    if (!assessment.is_published) throw new AppError('ASSESSMENT_CLOSED', 'Assessment is not open', 400);

    const now = new Date();
    if (assessment.open_at  && now < new Date(assessment.open_at))  throw new AppError('ASSESSMENT_CLOSED', 'Not yet open', 400);
    if (assessment.close_at && now > new Date(assessment.close_at)) throw new AppError('ASSESSMENT_CLOSED', 'Closed', 400);

    // Ensure the participant has an eligible registration for this activity
    const [[reg]] = await conn.query(
      `SELECT id, registration_status
         FROM registrations
        WHERE activity_id = ? AND participant_id = ?
        LIMIT 1`,
      [assessment.activity_id, participantId]
    );
    if (!reg) throw new AppError('NOT_REGISTERED', 'Not registered for this activity', 403);
    if (!['confirmed', 'attended'].includes(reg.registration_status)) {
      throw new AppError('REGISTRATION_NOT_APPROVED',
        `Registration status is "${reg.registration_status}"`, 403);
    }

    // Validate required fields — trim strings so " " does not count as an answer.
    const fields = assessment.form_schema.fields;
    for (const f of fields) {
      if (!f.required) continue;
      const v = responseData[f.id];
      const isEmpty =
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0);
      if (isEmpty) throw new AppError('MISSING_REQUIRED_FIELD',
        `Field "${f.id}" is required`, 422, { field: f.id });
    }

    // Insert response (UNIQUE key guards against double-submit)
    try {
      await conn.query(
        `INSERT INTO assessment_responses
           (assessment_id, participant_id, response_data, score)
         VALUES (?, ?, CAST(? AS JSON), NULL)`,
        [assessmentId, participantId, JSON.stringify(responseData)]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError('ALREADY_SUBMITTED',
          'You have already submitted this assessment', 409);
      }
      throw err;
    }

    // Mark attendance now if not already
    if (reg.registration_status === 'confirmed') {
      await conn.query(
        `UPDATE registrations
            SET registration_status = 'attended',
                checked_in_at = COALESCE(checked_in_at, NOW())
          WHERE id = ?`,
        [reg.id]
      );
    }

    // Auto-issue certificate for this registration (idempotent)
    const cert = await issueCertificateForRegistration(reg.id, conn);
    return { registration_id: reg.id, certificate: cert };
  });
}
