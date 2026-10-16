-- =============================================================================
--  Migration: สร้างตาราง portfolios ("ผลงานที่ผ่านมา" / Past Works)
--  Target  : MySQL 8.0+
--  Run     : mysql -h 127.0.0.1 -u <user> -p <database> < 2026-10-16_create_portfolios_table.sql
--
--  image_url เป็น LONGTEXT เพื่อเก็บ data:image/... base64 (เหมือน
--  activities.cover_image_url — ดู 2026-09-21_cover_image_longtext.sql) หรือ
--  http(s) URL ปกติก็ได้. ปลอดภัยต่อการรันบน DB ที่ใช้งานจริง (IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS `portfolios` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `title`         VARCHAR(255)    NOT NULL                 COMMENT 'ชื่อผลงาน',
  `description`   TEXT            NOT NULL                 COMMENT 'คำอธิบายผลงาน',
  `image_url`     LONGTEXT        NOT NULL                 COMMENT 'รูปภาพ — http(s) URL หรือ data:image/... base64',
  `display_order` INT             NOT NULL DEFAULT 0       COMMENT 'ลำดับการแสดง (น้อย = มาก่อน)',
  `is_active`     TINYINT(1)      NOT NULL DEFAULT 1       COMMENT '1=แสดงบนหน้าเว็บ 0=ซ่อน',
  `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_portfolios_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผลงานที่ผ่านมา (Past Works) — แสดงใน carousel หน้าแรก';
