-- Phase 3 — registration window as date+time.
--
-- Adds `register_open_at` and widens `register_close_date` from DATE to DATETIME
-- so admins can set an exact open/close time. Both nullable: an activity with no
-- window set behaves as before (gated only by status).
--
-- NOTE: activity datetimes in this system are stored as literal wall-clock
-- values (the "year" is already Buddhist era, see src/utils/thaiDate.js). We do
-- NOT convert timezones here. Existing DATE-only close dates default to
-- 00:00:00 after the MODIFY; we bump them to end-of-day so "closes on 1 Nov"
-- still accepts sign-ups through that whole day.
ALTER TABLE `activities`
  ADD COLUMN `register_open_at` DATETIME NULL COMMENT 'วันเวลาเปิดรับสมัคร' AFTER `title_en`,
  MODIFY COLUMN `register_close_date` DATETIME NULL COMMENT 'วันเวลาปิดรับสมัคร';

UPDATE `activities`
   SET `register_close_date` = TIMESTAMP(DATE(`register_close_date`), '23:59:59')
 WHERE `register_close_date` IS NOT NULL
   AND TIME(`register_close_date`) = '00:00:00';
