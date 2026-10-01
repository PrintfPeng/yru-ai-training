-- Widen assessments.description from TEXT → LONGTEXT so the certificate
-- editor can round-trip its full state (including a base64 background
-- image, which can be several MB per row). TEXT caps at 64KB so uploads
-- were silently truncating on save and the bg vanished on reload.
--
-- Safe to run on a live DB: MODIFY COLUMN on a growing type is an in-place
-- alter in MySQL 8 and preserves all existing rows.
ALTER TABLE `assessments`
  MODIFY COLUMN `description` LONGTEXT NULL;
