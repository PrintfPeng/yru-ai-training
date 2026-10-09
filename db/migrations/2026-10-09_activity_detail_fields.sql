-- Richer activity detail fields (course detail page). All nullable so existing
-- activities keep working; the detail page hides empty rows.
ALTER TABLE `activities`
  ADD COLUMN `batch_no`            INT          NULL                 COMMENT 'รุ่นที่ N',
  ADD COLUMN `title_en`            VARCHAR(255) NULL                 COMMENT 'ชื่อหลักสูตรภาษาอังกฤษ (subtitle)',
  ADD COLUMN `register_close_date` DATE         NULL                 COMMENT 'วันปิดรับสมัคร',
  ADD COLUMN `has_selection`       TINYINT(1)   NOT NULL DEFAULT 0   COMMENT 'มีการพิจารณาคัดเลือกหรือไม่',
  ADD COLUMN `fee_text`            VARCHAR(255) NULL                 COMMENT 'ค่าลงทะเบียน (ข้อความ)',
  ADD COLUMN `travel_text`         VARCHAR(500) NULL                 COMMENT 'ค่าเดินทาง (ข้อความ)',
  ADD COLUMN `venue_links`         JSON         NULL                 COMMENT 'ลิงก์สถานที่ [{label,url}]',
  ADD COLUMN `note_text`           VARCHAR(2000) NULL                COMMENT 'หมายเหตุ (กล่อง info)';
