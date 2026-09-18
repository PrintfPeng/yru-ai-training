import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { makeCertificateCode } from '../utils/slugify.js';

/**
 * Default template used when the activity's assessment doesn't specify one.
 * Keep synced with `src/components/CertificateEditor.jsx` DEFAULT_ELEMENTS().
 */
const DEFAULT_TEMPLATE = {
  name: 'ใบรับรองการอบรม AI Center YRU',
  template: 'classic',
  backgroundImageUrl: null,
  signatureImageUrl: null,
  signerName: 'ผู้อำนวยการศูนย์ AI YRU',
  signerPosition: 'AI Center, Yala Rajabhat University',
  elements: [
    { id: 'e1', kind: 'text', content: 'CERTIFICATE OF COMPLETION',
      x: 15, y: 12, width: 70, fontSize: 14, fontWeight: 'normal',
      color: '#9ca3af', textAlign: 'center', letterSpacing: 4,
      fontFamily: '"Playfair Display", serif' },
    { id: 'e2', kind: 'text', content: 'ใบรับรองการอบรม',
      x: 15, y: 20, width: 70, fontSize: 32, fontWeight: 'bold',
      color: '#ffffff', textAlign: 'center',
      fontFamily: '"Noto Serif Thai", serif' },
    { id: 'e3', kind: 'text', content: 'มอบให้กับ',
      x: 20, y: 36, width: 60, fontSize: 14, fontWeight: 'normal',
      color: '#d1d5db', textAlign: 'center',
      fontFamily: '"Sarabun", sans-serif' },
    { id: 'e4', kind: 'placeholder', field: 'participantName',
      x: 15, y: 44, width: 70, fontSize: 32, fontWeight: 'bold',
      color: '#ffffff', textAlign: 'center',
      fontFamily: '"Charmonman", cursive' },
    { id: 'e5', kind: 'text', content: 'เพื่อรับรองว่าได้ผ่านการอบรมหลักสูตร',
      x: 15, y: 62, width: 70, fontSize: 13, fontWeight: 'normal',
      color: '#d1d5db', textAlign: 'center',
      fontFamily: '"Sarabun", sans-serif' },
    { id: 'e6', kind: 'placeholder', field: 'courseTitle',
      x: 15, y: 68, width: 70, fontSize: 18, fontWeight: 'bold',
      color: '#f472b6', textAlign: 'center',
      fontFamily: '"Prompt", sans-serif' },
    { id: 'e7', kind: 'placeholder', field: 'issueDate',
      x: 20, y: 82, width: 25, fontSize: 11, fontWeight: 'normal',
      color: '#9ca3af', textAlign: 'left',
      fontFamily: '"Sarabun", sans-serif' },
    { id: 'e8', kind: 'placeholder', field: 'certificateId',
      x: 55, y: 82, width: 25, fontSize: 11, fontWeight: 'normal',
      color: '#9ca3af', textAlign: 'right',
      fontFamily: '"Sarabun", sans-serif' },
  ],
};

/**
 * Idempotent: return existing cert if any, otherwise create + return.
 * Accepts an optional `conn` so it can be used inside a transaction.
 */
export async function issueCertificateForRegistration(registrationId, conn = pool) {
  const [existing] = await conn.query(
    'SELECT * FROM certificates WHERE registration_id = ? LIMIT 1',
    [registrationId]
  );
  if (existing[0]) return existing[0];

  // Insert placeholder first to get row id → code generation depends on id
  const [ins] = await conn.query(
    `INSERT INTO certificates
       (registration_id, certificate_code, template_data, file_url)
     VALUES (?, ?, CAST(? AS JSON), NULL)`,
    [registrationId, `YRU-AI-TEMP-${registrationId}`, JSON.stringify(DEFAULT_TEMPLATE)]
  );

  const code = makeCertificateCode(ins.insertId);
  await conn.query('UPDATE certificates SET certificate_code = ? WHERE id = ?',
    [code, ins.insertId]);

  const [rows] = await conn.query('SELECT * FROM certificates WHERE id = ?', [ins.insertId]);
  return rows[0];
}

/**
 * Public lookup: `/verify/:code` — returns cert + substituted values so the page
 * can render or the client can build the PDF.
 */
export async function getCertificateByCode(code) {
  const [rows] = await pool.query(
    `SELECT c.id, c.certificate_code, c.template_data, c.file_url, c.issued_at,
            r.id AS registration_id,
            p.first_name, p.last_name, p.email,
            a.title AS course_title, a.slug AS course_slug,
            a.start_date, a.end_date
       FROM certificates  c
       JOIN registrations r ON r.id = c.registration_id
       JOIN participants  p ON p.id = r.participant_id
       JOIN activities    a ON a.id = r.activity_id
      WHERE c.certificate_code = ? LIMIT 1`,
    [code]
  );
  const row = rows[0];
  if (!row) throw new AppError('NOT_FOUND', 'Certificate not found', 404);

  return {
    certificate: {
      code: row.certificate_code,
      issued_at: row.issued_at,
      file_url: row.file_url,
      template: row.template_data,
    },
    participant: {
      name: `${row.first_name} ${row.last_name}`,
      email: row.email,
    },
    activity: {
      title: row.course_title,
      slug: row.course_slug,
      start_date: row.start_date,
      end_date: row.end_date,
    },
    // Precomputed substitutions the frontend can drop into placeholder elements
    substitutions: {
      participantName: `${row.first_name} ${row.last_name}`,
      courseTitle: row.course_title,
      issueDate: new Date(row.issued_at).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
      certificateId: row.certificate_code,
      signerName: row.template_data?.signerName ?? '',
      signerPosition: row.template_data?.signerPosition ?? '',
    },
  };
}
