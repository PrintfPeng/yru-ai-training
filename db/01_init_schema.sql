-- =============================================================================
--  YRU AI Training — Database Schema Initialization
--  Target : MySQL 8.0+ (needs JSON + CHECK constraint support)
--  Charset: utf8mb4 / utf8mb4_unicode_ci  (รองรับภาษาไทย + emoji)
--  Timezone: Asia/Bangkok (+07:00)
--
--  Idempotent : ทุกคำสั่งใช้ IF NOT EXISTS หรือ CREATE OR REPLACE
--  Run  :  mysql -u root -p < 01_init_schema.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET TIME_ZONE = '+07:00';

-- -----------------------------------------------------------------------------
-- 0) DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `yru_ai_training_db`
  CHARACTER SET utf8mb4
  COLLATE       utf8mb4_unicode_ci;

USE `yru_ai_training_db`;


-- =============================================================================
-- 1) admins — ผู้ดูแลระบบและเจ้าหน้าที่
-- =============================================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`        VARCHAR(50)     NOT NULL                                                COMMENT 'ชื่อผู้ใช้สำหรับ login (ไม่ซ้ำ)',
  `password_hash`   VARCHAR(255)    NOT NULL                                                COMMENT 'bcrypt hash (cost 10) — ห้ามเก็บ plain text',
  `first_name`      VARCHAR(100)    NOT NULL,
  `last_name`       VARCHAR(100)    NOT NULL,
  `email`           VARCHAR(150)    NOT NULL                                                COMMENT 'อีเมล (ไม่ซ้ำ) — ใช้กู้รหัสผ่านและแจ้งเตือน',
  `role`            ENUM('super_admin','admin','staff') NOT NULL DEFAULT 'admin'            COMMENT 'super_admin=จัดการทุกอย่าง admin=จัดการหลักสูตร staff=อ่านอย่างเดียว',
  `is_active`       TINYINT(1)      NOT NULL DEFAULT 1                                      COMMENT '0=ระงับการใช้งาน 1=ใช้งานได้',
  `last_login_at`   DATETIME        NULL                                                    COMMENT 'บันทึกครั้งล่าสุดที่ login สำเร็จ',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admins_username` (`username`),
  UNIQUE KEY `uq_admins_email`    (`email`),
  KEY `idx_admins_role_active`    (`role`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ตารางผู้ดูแลระบบและเจ้าหน้าที่';


-- =============================================================================
-- 2) activities — หลักสูตร/กิจกรรม
-- =============================================================================
CREATE TABLE IF NOT EXISTS `activities` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(255)    NOT NULL                                                COMMENT 'ชื่อหลักสูตรภาษาไทย',
  `slug`            VARCHAR(255)    NOT NULL                                                COMMENT 'URL-safe identifier (unique) — ใช้ใน QR /?e=<slug>',
  `description`     TEXT            NULL                                                    COMMENT 'รายละเอียดหลักสูตร',
  `location`        VARCHAR(255)    NULL                                                    COMMENT 'สถานที่จัด',
  `start_date`      DATETIME        NOT NULL                                                COMMENT 'วัน-เวลาเริ่มอบรม',
  `end_date`        DATETIME        NOT NULL                                                COMMENT 'วัน-เวลาสิ้นสุด (ต้อง >= start_date)',
  `capacity`        INT UNSIGNED    NOT NULL DEFAULT 0                                      COMMENT 'จำนวนที่รับได้ (0 = ไม่จำกัด)',
  `status`          ENUM('draft','published','completed','cancelled') NOT NULL DEFAULT 'draft'
                                                                                            COMMENT 'draft=ร่าง published=เปิดรับสมัคร completed=จบแล้ว cancelled=ยกเลิก',
  `cover_image_url` VARCHAR(500)    NULL                                                    COMMENT 'URL รูปแบนเนอร์ (S3/local static)',
  `created_by`      BIGINT UNSIGNED NULL                                                    COMMENT 'อ้างอิง admin ที่สร้าง (SET NULL ถ้า admin ถูกลบ)',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_activities_slug`        (`slug`),
  KEY        `idx_activities_status_date` (`status`, `start_date`),
  KEY        `idx_activities_created_by`  (`created_by`),
  CONSTRAINT `chk_activities_date_range` CHECK (`end_date` >= `start_date`),
  CONSTRAINT `fk_activities_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='หลักสูตรและกิจกรรมอบรมที่ศูนย์ AI YRU จัด';


-- =============================================================================
-- 3) participants — ผู้เข้าอบรม (ไม่ผูก activity — 1 คนไปได้หลายหลักสูตร)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `participants` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name`      VARCHAR(100)    NOT NULL,
  `last_name`       VARCHAR(100)    NOT NULL,
  `email`           VARCHAR(150)    NOT NULL                                                COMMENT 'อีเมล (ไม่ซ้ำ) — ใช้ระบุตัวตนหลัก',
  `phone`           VARCHAR(20)     NOT NULL                                                COMMENT 'เบอร์โทร (normalized 10 หลัก) — ใช้ verify ตอน scan QR',
  `organization`    VARCHAR(255)    NULL                                                    COMMENT 'หน่วยงาน / สถาบัน',
  `position`        VARCHAR(150)    NULL                                                    COMMENT 'ตำแหน่ง',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_participants_email` (`email`),
  KEY        `idx_participants_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผู้เข้าอบรม (คนกลาง — ผูกหลายกิจกรรมผ่าน registrations)';


-- =============================================================================
-- 4) registrations — การลงทะเบียนของผู้เข้าอบรมต่อกิจกรรม (M:N junction)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `registrations` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `activity_id`           BIGINT UNSIGNED NOT NULL,
  `participant_id`        BIGINT UNSIGNED NOT NULL,
  `registration_status`   ENUM('pending','confirmed','attended','cancelled') NOT NULL DEFAULT 'pending'
                                                                                            COMMENT 'pending=รอตรวจ confirmed=อนุมัติ attended=เข้าอบรม cancelled=ยกเลิก',
  `note`                  TEXT            NULL                                              COMMENT 'หมายเหตุจากผู้ลงทะเบียน',
  `checked_in_at`         DATETIME        NULL                                              COMMENT 'เวลา check-in หน้างาน',
  `registered_at`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registrations_activity_participant` (`activity_id`, `participant_id`)      /* 1 คน 1 หลักสูตร ลงทะเบียนได้ครั้งเดียว */,
  KEY        `idx_registrations_activity_status`     (`activity_id`, `registration_status`),
  KEY        `idx_registrations_participant`         (`participant_id`),
  CONSTRAINT `fk_registrations_activity`
    FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_registrations_participant`
    FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='การลงทะเบียนผู้เข้าอบรมต่อกิจกรรม (ตารางกลาง M:N)';


-- =============================================================================
-- 5) assessments — แบบสอบถาม/แบบประเมิน (Dynamic Form Builder)
-- =============================================================================
--
-- โครงสร้าง form_schema (JSON) ที่แนะนำ — อ้างอิง DynamicFormBuilder ของ frontend
-- ------------------------------------------------------------------------
-- {
--   "fields": [
--     {
--       "id"        : "q1",                    // ต้อง unique ในฟอร์ม
--       "type"      : "short_answer|paragraph|multiple_choice|checkboxes|dropdown|file_upload|date|time|rating",
--       "label"     : "ความพึงพอใจต่อวิทยากร",
--       "required"  : true,
--       "helpText"  : "โปรดตอบตามความรู้สึกจริง",
--       "options"   : ["พอใจมาก","พอใจ","ปานกลาง","ไม่พอใจ"],   // เฉพาะประเภทที่มีตัวเลือก
--       "validation": { "minLength": 1, "maxLength": 500, "pattern": null, "min": 1, "max": 5 }
--     },
--     ...
--   ]
-- }
--
-- ตัวอย่าง form_schema จริง 1 ชุด (satisfaction survey):
-- {
--   "fields": [
--     { "id":"q1", "type":"multiple_choice", "label":"ความพึงพอใจต่อวิทยากร",
--       "required":true, "options":["พอใจมาก","พอใจ","ปานกลาง","ไม่พอใจ","ไม่พอใจมาก"] },
--     { "id":"q2", "type":"multiple_choice", "label":"ความพึงพอใจต่อเนื้อหา",
--       "required":true, "options":["พอใจมาก","พอใจ","ปานกลาง","ไม่พอใจ","ไม่พอใจมาก"] },
--     { "id":"q3", "type":"checkboxes",      "label":"หัวข้อที่อยากให้จัดครั้งต่อไป",
--       "required":false, "options":["Machine Learning","Deep Learning","NLP","MLOps"] },
--     { "id":"q4", "type":"paragraph",       "label":"ข้อเสนอแนะเพิ่มเติม",
--       "required":false, "validation": { "maxLength": 2000 } }
--   ]
-- }
-- ------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `assessments` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `activity_id`     BIGINT UNSIGNED NOT NULL                                                COMMENT 'ผูกกับหลักสูตรที่ประเมิน',
  `title`           VARCHAR(255)    NOT NULL,
  `description`     TEXT            NULL,
  `type`            ENUM('pre_test','post_test','satisfaction','custom') NOT NULL DEFAULT 'satisfaction'
                                                                                            COMMENT 'ประเภทแบบประเมิน (satisfaction เป็น default เพราะระบบเราเน้นความพึงพอใจ)',
  `form_schema`     JSON            NOT NULL                                                COMMENT 'โครงสร้างฟอร์ม (fields[]) — ดูตัวอย่างในหัว table',
  `is_published`    TINYINT(1)      NOT NULL DEFAULT 0                                      COMMENT '1 = ผู้เข้าอบรมทำได้ 0 = admin ยังแก้อยู่',
  `open_at`         DATETIME        NULL                                                    COMMENT 'เวลาเปิดให้ทำ (NULL = เปิดทันที)',
  `close_at`        DATETIME        NULL                                                    COMMENT 'เวลาปิดรับคำตอบ (NULL = ไม่ปิด)',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assessments_activity`         (`activity_id`),
  KEY `idx_assessments_published_close`  (`is_published`, `close_at`),
  CONSTRAINT `fk_assessments_activity`
    FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  /* MySQL 8: JSON structure check (บอกให้แน่ใจว่ามี field "fields" เป็น array) */
  CONSTRAINT `chk_assessments_form_schema_shape`
    CHECK (JSON_TYPE(JSON_EXTRACT(`form_schema`, '$.fields')) = 'ARRAY')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='แบบประเมิน/แบบสอบถาม dynamic form';


-- =============================================================================
-- 6) assessment_responses — คำตอบของผู้เข้าอบรม
-- =============================================================================
--
-- response_data JSON format: { "<field_id>": <value>, ... }
-- ตัวอย่าง: { "q1": "พอใจมาก", "q3": ["NLP","MLOps"], "q4": "ดีมากครับ" }
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessment_responses` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `assessment_id`   BIGINT UNSIGNED NOT NULL,
  `participant_id`  BIGINT UNSIGNED NOT NULL,
  `response_data`   JSON            NOT NULL                                                COMMENT '{fieldId: value} — value เป็น string/number/array แล้วแต่ type',
  `score`           DECIMAL(5,2)    NULL                                                    COMMENT 'ใช้เฉพาะ pre_test/post_test (satisfaction จะเป็น NULL)',
  `submitted_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_responses_assessment_participant` (`assessment_id`, `participant_id`)      /* กันส่งซ้ำ */,
  KEY `idx_responses_participant`   (`participant_id`),
  KEY `idx_responses_submitted_at`  (`submitted_at`),
  CONSTRAINT `fk_responses_assessment`
    FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_responses_participant`
    FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='คำตอบของผู้เข้าอบรมสำหรับแต่ละแบบประเมิน';


-- =============================================================================
-- 7) certificates — วุฒิบัตร
-- =============================================================================
--
-- template_data JSON format (สอดคล้องกับ CertificateEditor ของ frontend):
-- ------------------------------------------------------------------------
-- {
--   "name"              : "ใบรับรองการอบรม AI Center YRU",
--   "template"          : "classic|modern|minimal",
--   "backgroundImageUrl": "https://.../bg.png"  |  null,
--   "signatureImageUrl" : "https://.../sig.png" |  null,
--   "signerName"        : "ดร. สมชาย เจริญสุข",
--   "signerPosition"    : "ผู้อำนวยการศูนย์ AI YRU",
--   "elements": [
--     {
--       "id"          : "e1",
--       "kind"        : "text|placeholder|image",
--       "content"     : "CERTIFICATE OF COMPLETION",     // text
--       "field"       : "participantName",               // placeholder
--       "src"         : "https://.../signature.png",     // image
--       "role"        : "signature",                     // image role tag
--       "x"           : 15,   "y" : 12,
--       "width"       : 70,   "height" : 30,
--       "fontSize"    : 14,
--       "fontFamily"  : "\"Playfair Display\", serif",
--       "fontWeight"  : "bold",
--       "color"       : "#ffffff",
--       "textAlign"   : "center",
--       "letterSpacing": 4
--     },
--     ...
--   ]
-- }
--
-- Placeholder field names ที่ backend ต้อง substitute ตอน render PDF:
--   participantName, courseTitle, issueDate, trainingHours, certificateId,
--   signerName, signerPosition
-- ------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `certificates` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `registration_id`  BIGINT UNSIGNED NOT NULL                                               COMMENT 'อ้างอิง 1 registration = 1 certificate',
  `certificate_code` VARCHAR(50)     NOT NULL                                               COMMENT 'รูปแบบ YRU-AI-{YYYY}-{6 หลัก} เช่น YRU-AI-2568-000042',
  `template_data`    JSON            NULL                                                   COMMENT 'snapshot ของ template ตอนออก (elements + fonts + positions)',
  `file_url`         VARCHAR(500)    NULL                                                   COMMENT 'PDF ที่ generate แล้ว (ถ้ามี — อาจ generate on-demand)',
  `issued_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_certificates_registration` (`registration_id`)                             /* 1 registration = 1 cert */,
  UNIQUE KEY `uq_certificates_code`         (`certificate_code`),
  KEY `idx_certificates_issued_at`          (`issued_at`),
  CONSTRAINT `fk_certificates_registration`
    FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='วุฒิบัตรที่ออกให้ผู้เข้าอบรม';


-- =============================================================================
--  VIEW: v_activity_summary
--  ใช้แสดง dashboard สรุปยอดลงทะเบียน/เข้าอบรมแต่ละกิจกรรม
-- =============================================================================
CREATE OR REPLACE VIEW `v_activity_summary` AS
SELECT
    a.id                                                              AS activity_id,
    a.title,
    a.slug,
    a.status,
    a.start_date,
    a.end_date,
    a.capacity,
    COUNT(r.id)                                                       AS total_registered,
    SUM(CASE WHEN r.registration_status = 'attended'  THEN 1 ELSE 0 END) AS total_attended,
    SUM(CASE WHEN r.registration_status = 'confirmed' THEN 1 ELSE 0 END) AS total_confirmed,
    SUM(CASE WHEN r.registration_status = 'pending'   THEN 1 ELSE 0 END) AS total_pending,
    /* seats_left: ถ้า capacity=0 (unlimited) คืน NULL, ไม่ให้ติดลบ */
    CASE
      WHEN a.capacity = 0 THEN NULL
      ELSE GREATEST(a.capacity - COUNT(r.id), 0)
    END                                                               AS seats_left
FROM       `activities`    a
LEFT JOIN  `registrations` r ON r.activity_id = a.id
                             AND r.registration_status <> 'cancelled'
GROUP BY   a.id;


-- =============================================================================
--  ทำไม "capacity check" ควรอยู่ที่ APPLICATION LAYER ไม่ใช่ TRIGGER
-- =============================================================================
--  1. Trigger BEFORE INSERT ต้องนับด้วย SELECT COUNT — เกิด race condition
--     ระหว่าง 2 request พร้อมกัน (ต้องใช้ SELECT ... FOR UPDATE ใน transaction
--     ซึ่ง trigger ทำได้ยากและ debug ยาก)
--  2. Trigger SIGNAL SQLSTATE ส่ง error กลับเป็น string — hard สำหรับ frontend
--     ที่ต้องแยก error types (over_capacity vs duplicate vs invalid)
--  3. Business rule เปลี่ยนบ่อย เช่น admin over-ride, waitlist, early-bird —
--     อยู่ใน code อ่านง่ายกว่าและ test ได้
--
--  แนะนำ pattern ใน backend (Node.js + mysql2):
--  ------------------------------------------------------------------------
--     const conn = await pool.getConnection();
--     try {
--       await conn.beginTransaction();
--       const [[act]] = await conn.query(
--         'SELECT capacity, (SELECT COUNT(*) FROM registrations
--                             WHERE activity_id = ?
--                               AND registration_status <> "cancelled") AS cnt
--          FROM activities WHERE id = ? FOR UPDATE',
--         [activityId, activityId]
--       );
--       if (act.capacity > 0 && act.cnt >= act.capacity)
--         throw new AppError('OVER_CAPACITY', 409);
--       await conn.query(
--         'INSERT INTO registrations (activity_id, participant_id) VALUES (?, ?)',
--         [activityId, participantId]
--       );
--       await conn.commit();
--     } catch (e) { await conn.rollback(); throw e; }
--     finally    { conn.release(); }
--  ------------------------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 1;
-- End of 01_init_schema.sql
