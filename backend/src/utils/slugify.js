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
 * Generate a certificate code YRU-AI-{BE_YEAR}-{6-digit sequence}.
 * Sequence comes from the DB row id (padded), so no extra table needed.
 */
export function makeCertificateCode(rowId, issuedAt = new Date()) {
  const buddhistYear = issuedAt.getFullYear() + 543;
  const seq = String(rowId).padStart(6, '0');
  return `YRU-AI-${buddhistYear}-${seq}`;
}
