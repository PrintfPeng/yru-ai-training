// Date helpers for activity dates.
//
// Activity dates are stored with a Buddhist year already (e.g. 2569-11-01), so
// we must NOT run them through `toLocaleDateString('th-TH')` — that treats the
// year as Gregorian and adds 543 again (2569 → 3112). Instead we read the
// Y-M-D straight off the ISO string, which is also timezone-safe.

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                   'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const pickYMD = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null;
};

/** "2569-11-01T…" → "1 พ.ย. 2569" (year shown as-is, no +543). */
export const formatThaiDate = (iso) => {
  const p = pickYMD(iso);
  return p ? `${p.d} ${TH_MONTHS[p.mo - 1]} ${p.y}` : '-';
};

/** "2569-11-01T…" → "2569-11-01" for <input type="date">. */
export const toDateInputValue = (iso) => {
  const m = String(iso || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
};

/** "2569-11-01T09:00:00" → "2569-11-01T09:00" for <input type="datetime-local">. */
export const toDateTimeInputValue = (iso) => {
  const m = String(iso || '').match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : '';
};

/**
 * Normalize a date / datetime string to the Buddhist era (พ.ศ.).
 *
 * The whole app stores, displays, and compares activity dates in พ.ศ. (seed
 * data uses 2569; registration-window checks shift NOW() by +543). Native
 * <input type="date"> / <input type="datetime-local"> pickers may hand back a
 * Gregorian (ค.ศ.) year, so we normalize on save: a year < 2500 is treated as
 * ค.ศ. and shifted +543; a year already >= 2500 is left as-is. Idempotent, so
 * it is safe to run on values that are already พ.ศ.
 */
export const toBE = (s) => {
  const m = String(s || '').match(/^(\d{4})([-T].*)?$/);
  if (!m) return s || '';
  const y = +m[1];
  return y < 2500 ? `${y + 543}${m[2] || ''}` : s;
};

/**
 * Parse a stored พ.ศ. wall-clock string into a real (Gregorian) JS Date, so it
 * can be compared/subtracted against Date.now(). The stored year is พ.ศ., so we
 * subtract 543 to get the ค.ศ. year the JS Date constructor expects. Returns
 * null when the input has no parseable date.
 */
export const beToLocalDate = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return new Date(+m[1] - 543, +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
};

/** "2569-11-01T09:00…" → "1 พ.ย. 2569 09:00 น." (date shown as-is, no +543). */
export const formatThaiDateTime = (iso) => {
  const p = pickYMD(iso);
  if (!p) return '-';
  const t = String(iso || '').match(/[T ](\d{2}:\d{2})/);
  const time = t ? ` ${t[1]} น.` : '';
  return `${p.d} ${TH_MONTHS[p.mo - 1]} ${p.y}${time}`;
};

/**
 * Registration-window state vs "now".
 *
 * Stored datetimes use a Buddhist-era year as an opaque literal (e.g.
 * 2569-11-01T09:00:00), so we build a BE-era "now" string and compare
 * lexicographically (both are zero-padded 'YYYY-MM-DDTHH:mm:ss').
 *
 * Returns 'before' (not open yet), 'open', 'closed', or 'none' (no window set).
 */
export const registrationWindowState = (openIso, closeIso) => {
  const open = toDateTimeInputValue(openIso);   // '' when null/absent
  const close = toDateTimeInputValue(closeIso);
  if (!open && !close) return 'none';
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const beNow =
    `${d.getFullYear() + 543}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (open && beNow < open) return 'before';
  if (close && beNow > close) return 'closed';
  return 'open';
};

/** Inclusive day count between two activity dates (min 1). */
export const durationDays = (start, end) => {
  const a = pickYMD(start), b = pickYMD(end);
  if (!a || !b) return 1;
  const da = Date.UTC(a.y, a.mo - 1, a.d);
  const db = Date.UTC(b.y, b.mo - 1, b.d);
  return Math.max(1, Math.round((db - da) / 86400000) + 1);
};

/** Same as durationDays but as "N วัน". */
export const durationText = (start, end) => `${durationDays(start, end)} วัน`;
