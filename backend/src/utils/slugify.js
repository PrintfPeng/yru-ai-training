/**
 * Convert Thai/English title to URL-safe slug.
 * Thai characters are transliterated by keeping them (utf-8 slug is OK in URL)
 * but we normalize spaces and drop most punctuation.
 */
export function slugify(input) {
  if (!input) return '';
  return String(input)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}\-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

/**
 * Normalize Thai phone: strip non-digits, unwrap +66 → 0, return 10 digits.
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('66')) digits = '0' + digits.slice(2);
  return digits;
}

/**
 * Generate an official certificate code: ควท.มรย.{BE_YEAR}/03/{running}.
 *   ควท = คณะวิทยาศาสตร์เทคโนโลยีและการเกษตร
 *   มรย = มหาวิทยาลัยราชภัฏยะลา
 *   03  = ศูนย์ปัญญาประดิษฐ์ (constant)
 * `beYear` is the Buddhist year (derived from the activity start_date) and
 * `runningNo` is the per-year running number from the cert_counters table.
 */
export function makeCertificateCode(beYear, runningNo) {
  const seq = String(runningNo).padStart(3, '0');
  return `ควท.มรย.${beYear}/03/${seq}`;
}
