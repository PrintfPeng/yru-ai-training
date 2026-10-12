// Turn a thrown error (usually an ApiError from src/api/client.js) into a
// friendly Thai message for toasts. Falls back to the raw message, then a
// generic line, so a toast is never empty.

// Known backend error codes → Thai copy.
const CODE_MESSAGES = {
  NETWORK_ERROR:   'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
  DUPLICATE_SLUG:  'มีหลักสูตรชื่อ (slug) นี้อยู่แล้ว กรุณาเปลี่ยนชื่อ',
  DUPLICATE:       'ข้อมูลนี้มีอยู่แล้วในระบบ',
  OVER_CAPACITY:   'ที่นั่งเต็มแล้ว ไม่สามารถลงทะเบียนเพิ่มได้',
  ACTIVITY_NOT_OPEN:     'กิจกรรมนี้ยังไม่เปิดรับสมัคร',
  REGISTRATION_NOT_OPEN: 'ยังไม่ถึงเวลาเปิดรับสมัคร',
  REGISTRATION_CLOSED:   'ปิดรับสมัครแล้ว',
  INVALID_PHONE:   'เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องมี 10 หลัก)',
  NOT_FOUND:       'ไม่พบข้อมูลที่ต้องการ',
  UNAUTHORIZED:    'กรุณาเข้าสู่ระบบใหม่',
  FORBIDDEN:       'คุณไม่มีสิทธิ์ทำรายการนี้',
  INTERNAL_ERROR:  'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง',
};

// Common backend field names → Thai labels, for VALIDATION_ERROR details.
const FIELD_LABELS = {
  title: 'ชื่อหลักสูตร',
  start_date: 'วันเริ่มอบรม',
  end_date: 'วันสิ้นสุดอบรม',
  register_open_at: 'วันเปิดรับสมัคร',
  register_close_date: 'วันปิดรับสมัคร',
  capacity: 'จำนวนที่รับ',
  cover_image_url: 'รูปแบนเนอร์',
  first_name: 'ชื่อ',
  last_name: 'นามสกุล',
  email: 'อีเมล',
  phone: 'เบอร์โทรศัพท์',
  team_name: 'ชื่อทีม',
  members: 'สมาชิกทีม',
};

// Pull a readable summary out of a Zod flatten() payload (fieldErrors / formErrors).
function describeValidation(details) {
  if (!details) return null;
  const parts = [];
  const fieldErrors = details.fieldErrors || {};
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (!msgs || !msgs.length) continue;
    const label = FIELD_LABELS[key] || key;
    parts.push(label);
  }
  if (Array.isArray(details.formErrors) && details.formErrors.length) {
    parts.push(...details.formErrors);
  }
  if (!parts.length) return null;
  return `ข้อมูลไม่ถูกต้อง: ${parts.join(', ')}`;
}

export function errorMessage(err, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่') {
  if (!err) return fallback;
  const code = err.code;

  if (code === 'VALIDATION_ERROR') {
    return describeValidation(err.details) || 'กรอกข้อมูลไม่ครบหรือไม่ถูกต้อง';
  }
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  // ApiError carries a backend message; show it if it looks human-readable.
  if (err.message && !/^HTTP_\d+$/.test(err.message)) return err.message;
  return fallback;
}
