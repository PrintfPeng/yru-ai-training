import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Room-booking data lives in a public Google Sheet (Google Form responses).
 * We read it server-side (no CORS, hides the URL) as CSV and cache it briefly
 * so the admin page can list bookings without hammering Google.
 *
 * READ-ONLY: new bookings still go through the Google Form; this never writes.
 *
 * Sheet columns (gid=0):
 *   0 Gmail (มักว่าง) | 1 วันที่ใช้ห้อง | 2 ผู้จอง | 3 เวลาจาก | 4 เวลาถึง
 *   5 วัตถุประสงค์ใช้ห้อง | 6 เบอร์ติดต่อ | 7 ชื่อผู้ใช้/หน่วยงาน
 */

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 นาที
let cache = { at: 0, data: null };

// Minimal RFC-4180 CSV parser: handles quoted fields, escaped quotes (""),
// commas and newlines inside quotes, and CRLF line endings.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const clean = (s) => String(s ?? '').trim();

function mapRow(cols) {
  return {
    date:         clean(cols[1]),
    booker:       clean(cols[2]),
    timeFrom:     clean(cols[3]),
    timeTo:       clean(cols[4]),
    purpose:      clean(cols[5]),
    phone:        clean(cols[6]),
    organization: clean(cols[7]),
  };
}

/**
 * Fetch + parse the booking sheet. Returns an array of booking objects sorted
 * by date (ascending). Serves the cached copy within the TTL, and falls back to
 * a stale cache if Google is unreachable.
 */
export async function listRoomBookings({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.data && now - cache.at < CACHE_TTL_MS) return cache.data;

  let text;
  try {
    const res = await fetch(env.ROOM_SHEET_CSV_URL, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (_e) {
    if (cache.data) return cache.data; // serve stale rather than erroring
    throw new AppError('ROOM_SHEET_FETCH_FAILED', 'ดึงข้อมูลการจองห้องไม่สำเร็จ', 502);
  }

  const rows = parseCsv(text);
  const body = rows.slice(1); // drop the header row
  const data = body
    .map(mapRow)
    .filter((b) => b.date || b.booker || b.purpose) // skip fully-empty lines
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  cache = { at: now, data };
  return data;
}
