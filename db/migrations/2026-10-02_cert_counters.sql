-- Per-year running counter for certificate numbers.
-- New certificate code format: ควท.มรย.{BE_YEAR}/03/{running}
--   ควท = คณะวิทยาศาสตร์เทคโนโลยีและการเกษตร
--   มรย = มหาวิทยาลัยราชภัฏยะลา
--   03  = ศูนย์ปัญญาประดิษฐ์
--   running = เลขรันต่อเนื่องต่อปี (นับรวมทุกกิจกรรมของศูนย์ในปีนั้น)
-- BE year is derived from each activity's start_date, so the counter is keyed
-- by Buddhist year and shared across all activities within that year.
CREATE TABLE IF NOT EXISTS `cert_counters` (
  `be_year` INT         NOT NULL                 COMMENT 'ปี พ.ศ. (จากปีเริ่มกิจกรรม)',
  `last_no` INT         NOT NULL DEFAULT 0        COMMENT 'เลขรันล่าสุดของปีนั้น',
  PRIMARY KEY (`be_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
