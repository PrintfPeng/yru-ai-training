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
      `SELECT id, activity_id, form_schema, description, is_published, open_at, close_at
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
      let isEmpty;
      if (f.type === 'rating_matrix') {
        // Every sub-row (options[]) must have a score.
        const rows = f.options || [];
        isEmpty = !v || typeof v !== 'object' || rows.some((_, i) => v[i] == null);
      } else {
        isEmpty =
          v === undefined ||
          v === null ||
          (typeof v === 'string' && v.trim() === '') ||
          (Array.isArray(v) && v.length === 0);
      }
      if (isEmpty) throw new AppError('MISSING_REQUIRED_FIELD',
        `Field "${f.id}" is required`, 422, { field: f.id });
    }

    // Insert response (UNIQUE key guards against double-submit). A duplicate is
    // NOT a hard error: we fall through to (re-)issue the certificate so a
    // participant whose cert was removed/regenerated can still get it, and a
    // double-submit just returns the existing cert idempotently.
    try {
      await conn.query(
        `INSERT INTO assessment_responses
           (assessment_id, participant_id, response_data, score)
         VALUES (?, ?, CAST(? AS JSON), NULL)`,
        [assessmentId, participantId, JSON.stringify(responseData)]
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') throw err;
      // already submitted — keep going to ensure a certificate exists
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

    // Pull the admin's certificate design out of the assessment description.
    // CreateAssessment appends it as a trailing <!-- CERT_CONFIG:{…} --> comment
    // so the whole blob (background image, elements, signer, …) round-trips
    // without needing a dedicated column yet.
    const template = parseCertConfig(assessment.description);

    // Auto-issue certificate for this registration (idempotent)
    const cert = await issueCertificateForRegistration(reg.id, conn, template);
    return { registration_id: reg.id, certificate: cert };
  });
}

/**
 * Aggregate the responses of an assessment for the results dashboard.
 *
 * Returns:
 *   {
 *     response_count,
 *     overall_avg,            // mean of every matrix score, normalised to /5
 *     overall_scale: 5,
 *     matrices: [{ field_id, label, scaleMax, overall_avg,
 *                  rows: [{ index, label, avg, count }] }],
 *     choices:  [{ field_id, label, type, total,
 *                  options: [{ label, count }] }],   // single/multi/dropdown
 *     texts:    [{ field_id, label, type, answers: [string] }], // free text
 *   }
 *
 * Only rating_matrix feeds the bar chart + overall average; multiple_choice /
 * dropdown / checkboxes feed the pie chart(s); short_answer / paragraph feed
 * the text-answer lists. Answers are read straight from the stored JSON, so
 * this needs no extra columns.
 */
const TEXT_TYPES    = ['short_answer', 'paragraph'];
const CHOICE_TYPES  = ['multiple_choice', 'dropdown', 'checkboxes'];
const SCALE_TYPES   = ['multiple_choice', 'dropdown']; // single-select → can be a 1-5 rating
const MAX_TEXT_ANSWERS = 500;   // cap per field so a huge survey can't blow up the payload
const MAX_TEXT_LEN     = 1000;  // trim each answer

// A single-select choice question whose options are ALL scores is treated as a
// rating scale, not a category: it feeds the overall average and the per-aspect
// bars instead of a pie chart. An option scores if it is a number ("3" → 3) or
// a known Thai Likert label ("พอใจมาก" → 5), so both styles of satisfaction
// survey light up the dashboard.
const toNumber = (s) => {
  const n = Number(String(s ?? '').trim());
  return Number.isFinite(n) ? n : null;
};

// Common Thai 5-point satisfaction wording → score. Covers the มากที่สุด…,
// พอใจมาก…, and ดีมาก… families. Longest keys are matched first so "ไม่พอใจมาก"
// (1) is not shadowed by "พอใจมาก" (5).
const LIKERT_LABELS = [
  ['มากที่สุด', 5], ['น้อยที่สุด', 1], ['ปานกลาง', 3],
  ['ไม่พอใจมาก', 1], ['ไม่พอใจ', 2], ['พอใจมาก', 5], ['พอใจ', 4],
  ['ดีมาก', 5], ['แย่มาก', 1], ['ควรปรับปรุง', 2],
  ['มาก', 4], ['น้อย', 2], ['ดี', 4], ['เฉย', 3], ['แย่', 2],
].sort((a, b) => b[0].length - a[0].length);

const labelScore = (opt) => {
  const num = toNumber(opt);
  if (num !== null) return num;
  const s = String(opt ?? '').trim();
  if (!s) return null;
  const hit = LIKERT_LABELS.find(([key]) => s.includes(key));
  return hit ? hit[1] : null;
};

const isNumericScale = (f) =>
  SCALE_TYPES.includes(f.type) &&
  Array.isArray(f.options) && f.options.length > 0 &&
  f.options.every((o) => labelScore(o) !== null);

export async function getResponseSummary(assessmentId) {
  const [[assessment]] = await pool.query(
    'SELECT id, form_schema FROM assessments WHERE id = ? LIMIT 1',
    [assessmentId]
  );
  if (!assessment) throw new AppError('NOT_FOUND', 'Assessment not found', 404);

  const [rows] = await pool.query(
    'SELECT response_data FROM assessment_responses WHERE assessment_id = ?',
    [assessmentId]
  );

  // mysql2 may hand back a JSON column as an object or as a raw string.
  const parse = (d) => {
    if (d && typeof d === 'object') return d;
    try { return JSON.parse(d); } catch { return {}; }
  };
  const responses = rows.map((r) => parse(r.response_data));

  const fields = assessment.form_schema?.fields || [];

  // ---- rating_matrix → per-row averages + the grand overall average ----
  let grandSum = 0, grandCount = 0;
  const matrices = fields
    .filter((f) => f.type === 'rating_matrix')
    .map((f) => {
      const scaleMax = f.scaleMax || 5;
      const acc = (f.options || []).map((label, i) => ({ index: i, label, sum: 0, count: 0 }));
      for (const data of responses) {
        const v = data?.[f.id];
        if (!v || typeof v !== 'object') continue;
        acc.forEach((row, i) => {
          const score = Number(v[i]);
          if (Number.isFinite(score)) { row.sum += score; row.count += 1; }
        });
      }
      const outRows = acc.map((r) => ({
        index: r.index, label: r.label, count: r.count,
        avg: r.count ? +(r.sum / r.count).toFixed(2) : null,
      }));
      const totalSum = acc.reduce((a, r) => a + r.sum, 0);
      const totalCount = acc.reduce((a, r) => a + r.count, 0);
      // Normalise each matrix's scores to a /5 scale before folding into the
      // grand average, so a 10-point matrix doesn't dominate a 5-point one.
      grandSum += totalCount ? (totalSum / scaleMax) * 5 : 0;
      grandCount += totalCount;
      return {
        field_id: String(f.id),
        label: f.label,
        scaleMax,
        overall_avg: totalCount ? +(totalSum / totalCount).toFixed(2) : null,
        rows: outRows,
      };
    });

  // ---- numeric single-select choice questions → per-question rating scales ----
  // Each such question is one "aspect" (one bar) and folds into the overall
  // average, normalised to /5 just like the matrices above.
  const scales = fields
    .filter(isNumericScale)
    .map((f) => {
      const scaleMax = Math.max(...f.options.map(labelScore));
      let sum = 0, count = 0;
      for (const data of responses) {
        const n = labelScore(data?.[f.id]);
        if (n !== null) { sum += n; count += 1; }
      }
      grandSum += count && scaleMax ? (sum / scaleMax) * 5 : 0;
      grandCount += count;
      return {
        field_id: String(f.id),
        label: f.label,
        scaleMax,
        count,
        avg: count ? +(sum / count).toFixed(2) : null,
      };
    });

  const overall_avg = grandCount ? +(grandSum / grandCount).toFixed(2) : null;

  // ---- choice questions → option counts (pie chart) ----
  // Numeric rating scales are handled above, so keep them out of the pie set.
  const choices = fields
    .filter((f) => CHOICE_TYPES.includes(f.type) && !isNumericScale(f))
    .map((f) => {
      const counts = new Map((f.options || []).map((o) => [o, 0]));
      let total = 0;
      const bump = (val) => {
        if (val == null || val === '') return;
        counts.set(val, (counts.get(val) || 0) + 1); // keeps "other" values too
        total += 1;
      };
      for (const data of responses) {
        const v = data?.[f.id];
        if (Array.isArray(v)) v.forEach(bump);      // checkboxes
        else bump(v);                               // single choice / dropdown
      }
      return {
        field_id: String(f.id),
        label: f.label,
        type: f.type,
        total,
        options: [...counts.entries()]
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
      };
    });

  // ---- free-text questions → the list of written answers ----
  const texts = fields
    .filter((f) => TEXT_TYPES.includes(f.type))
    .map((f) => {
      const answers = [];
      for (const data of responses) {
        if (answers.length >= MAX_TEXT_ANSWERS) break;
        const v = data?.[f.id];
        if (typeof v === 'string' && v.trim() !== '') {
          answers.push(v.trim().slice(0, MAX_TEXT_LEN));
        }
      }
      return { field_id: String(f.id), label: f.label, type: f.type, answers };
    });

  return {
    response_count: rows.length,
    overall_avg,
    overall_scale: 5,
    matrices,
    scales,
    choices,
    texts,
  };
}

// Extracts the JSON from `<!-- CERT_CONFIG:{…} -->` in an assessment
// description. Returns null when the comment is absent or malformed.
function parseCertConfig(desc) {
  if (!desc) return null;
  const m = String(desc).match(/<!--\s*CERT_CONFIG:([\s\S]*?)-->/);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch {
    return null;
  }
}
