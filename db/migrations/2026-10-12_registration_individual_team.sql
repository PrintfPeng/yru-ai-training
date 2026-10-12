-- Individual / Team registration model.
-- All additive + nullable/defaulted so existing activities keep working.

-- activities: registration type + team settings + dynamic registration form schema
ALTER TABLE `activities`
  ADD COLUMN `registration_type`   ENUM('individual','team') NOT NULL DEFAULT 'individual'
                                   COMMENT 'เดี่ยว / ทีม',
  ADD COLUMN `team_max_members`    INT NOT NULL DEFAULT 5
                                   COMMENT 'จำนวนสมาชิกสูงสุดต่อทีม',
  ADD COLUMN `team_cert_mode`      ENUM('per_person','team') NULL
                                   COMMENT 'per_person=ชื่อผู้ทำ+ทีม, team=ทุกคน+ทีม',
  ADD COLUMN `register_form_schema` JSON NULL
                                   COMMENT 'ฟอร์มสมัคร (คำถาม) แบบ dynamic';

-- participants: คำนำหน้าชื่อ
ALTER TABLE `participants`
  ADD COLUMN `prefix` VARCHAR(20) NULL COMMENT 'คำนำหน้า (นาย/นาง/นางสาว/เด็กชาย/เด็กหญิง)';

-- teams: 1 ทีม ต่อ 1 กิจกรรม (สมาชิกผูกผ่าน registrations.team_id)
CREATE TABLE IF NOT EXISTS `teams` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `activity_id` BIGINT UNSIGNED NOT NULL,
  `team_name`   VARCHAR(255)    NOT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teams_activity` (`activity_id`),
  CONSTRAINT `fk_teams_activity` FOREIGN KEY (`activity_id`)
    REFERENCES `activities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- registrations: ผูกสมาชิกเข้ากับทีม (NULL = ลงเดี่ยว)
ALTER TABLE `registrations`
  ADD COLUMN `team_id` BIGINT UNSIGNED NULL COMMENT 'ทีมที่สังกัด (NULL = เดี่ยว)',
  ADD KEY `idx_registrations_team` (`team_id`),
  ADD CONSTRAINT `fk_registrations_team` FOREIGN KEY (`team_id`)
    REFERENCES `teams`(`id`) ON DELETE SET NULL;
