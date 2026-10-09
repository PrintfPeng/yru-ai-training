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
