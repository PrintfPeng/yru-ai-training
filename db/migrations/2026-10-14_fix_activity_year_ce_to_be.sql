-- Fix era mismatch on activity dates.
--
-- Activities created through the admin form stored dates with a Gregorian
-- (ค.ศ.) year — e.g. 2026 — instead of the Buddhist-era (พ.ศ.) year the rest of
-- the system assumes. Seed data and the registration-window checks all treat
-- activities.* dates as พ.ศ. (see src/utils/thaiDate.js and
-- backend/src/services/registrations.service.js, which shift NOW() by +543
-- before comparing). Because "now" (พ.ศ. 2569) was always greater than a ค.ศ.
-- close date (2026), those activities were permanently shown as "ปิดรับสมัคร".
--
-- The create/edit forms now convert ค.ศ.→พ.ศ. on save. This backfills the rows
-- that were stored before the fix.
--
-- Heuristic: year < 2500 → Gregorian, needs +543; year >= 2500 → already พ.ศ.,
-- left untouched. This makes the migration idempotent (safe to run twice) and
-- leaves correctly-seeded (2569) rows alone. Only activities.* wall-clock dates
-- are touched; created_at/updated_at (real timestamps) are not.

UPDATE `activities`
   SET `start_date` = DATE_ADD(`start_date`, INTERVAL 543 YEAR)
 WHERE `start_date` IS NOT NULL AND YEAR(`start_date`) < 2500;

UPDATE `activities`
   SET `end_date` = DATE_ADD(`end_date`, INTERVAL 543 YEAR)
 WHERE `end_date` IS NOT NULL AND YEAR(`end_date`) < 2500;

UPDATE `activities`
   SET `register_open_at` = DATE_ADD(`register_open_at`, INTERVAL 543 YEAR)
 WHERE `register_open_at` IS NOT NULL AND YEAR(`register_open_at`) < 2500;

UPDATE `activities`
   SET `register_close_date` = DATE_ADD(`register_close_date`, INTERVAL 543 YEAR)
 WHERE `register_close_date` IS NOT NULL AND YEAR(`register_close_date`) < 2500;
