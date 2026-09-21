-- Widen activities.cover_image_url from VARCHAR(500) → LONGTEXT so the column
-- can hold data:image/... base64 banner uploads (up to ~10 MB per row) in
-- addition to normal http(s) URLs.
--
-- Safe to run on a live DB: MODIFY COLUMN on a growing type is an in-place
-- alter in MySQL 8 and preserves all existing rows.
ALTER TABLE `activities`
  MODIFY COLUMN `cover_image_url` LONGTEXT NULL
    COMMENT 'URL รูปแบนเนอร์ — รองรับทั้ง http(s) URL และ data:image/... base64';
