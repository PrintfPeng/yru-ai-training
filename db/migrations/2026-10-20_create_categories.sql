-- =============================================================================
--  Migration: หมวดหมู่กิจกรรม (categories) + ตารางเชื่อม activity_categories
--  Target  : MySQL 8.0+
--  Run     : mysql -h 127.0.0.1 -u <user> -p <database> < 2026-10-20_create_categories.sql
--
--  กิจกรรม 1 รายการอยู่ได้หลายหมวดหมู่ (many-to-many). หน้าเว็บสาธารณะ
--  แสดงกิจกรรมตามหมวดผ่านลิงก์ /?view=training&cat=<slug>.
--  ปลอดภัยต่อการรันบน DB ที่ใช้งานจริง (IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS `categories` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)    NOT NULL                 COMMENT 'ชื่อหมวดหมู่',
  `slug`          VARCHAR(120)    NOT NULL                 COMMENT 'URL-safe identifier (unique) — ใช้ในลิงก์ ?cat=<slug>',
  `description`   VARCHAR(500)    NULL                     COMMENT 'คำอธิบายหมวดหมู่ (แสดงบนหน้าเว็บ)',
  `display_order` INT             NOT NULL DEFAULT 0       COMMENT 'ลำดับการแสดง (น้อย = มาก่อน)',
  `is_active`     TINYINT(1)      NOT NULL DEFAULT 1       COMMENT '1=แสดงบนหน้าเว็บ 0=ซ่อน',
  `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='หมวดหมู่กิจกรรม/หลักสูตร';

CREATE TABLE IF NOT EXISTS `activity_categories` (
  `activity_id`   BIGINT UNSIGNED NOT NULL,
  `category_id`   INT UNSIGNED    NOT NULL,
  PRIMARY KEY (`activity_id`, `category_id`),
  KEY `idx_activity_categories_category` (`category_id`),
  CONSTRAINT `fk_actcat_activity`
    FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_actcat_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='กิจกรรม ↔ หมวดหมู่ (many-to-many)';
