-- =============================================================================
--  YRU AI Training — Seed Data (idempotent, safe to re-run)
--  Run  :  mysql -u root -p yru_ai_training_db < 03_seed_data.sql
--
--  ทุก INSERT ใช้ INSERT ... ON DUPLICATE KEY UPDATE หรือ INSERT IGNORE
--  → รันซ้ำได้โดยไม่ error, ไม่สร้าง duplicate
-- =============================================================================

SET NAMES utf8mb4;
SET TIME_ZONE = '+07:00';

USE `yru_ai_training_db`;

-- =============================================================================
-- 1) admins
-- =============================================================================
--
--  ⚠️  bcrypt hash ด้านล่างเป็น "ตัวอย่าง" ที่คุณต้อง regenerate ด้วยตัวเอง
--     (ผมไม่สามารถ compute hash จริงจาก plain text ตอนนี้ได้ในเซสชันนี้)
--
--  วิธี generate hash ของ 'Admin@1234' บน Linux (ต้องมี Node.js + bcrypt):
--  -------------------------------------------------------------------------
--     cd ~/yru-ai-training
--     npm install --no-save bcrypt
--     node -e "require('bcrypt').hash('Admin@1234', 10).then(h => console.log(h))"
--
--  หรือ one-liner ที่ไม่ต้อง install:
--     npx -y bcryptjs 'Admin@1234' 10          # ใช้ bcryptjs (pure JS, ช้ากว่าเล็กน้อย)
--
--  เอา hash ที่ output ออกมา (ขึ้นต้น $2b$10$...) UPDATE ทับ:
--     UPDATE admins SET password_hash='$2b$10$...' WHERE username='superadmin';
--     UPDATE admins SET password_hash='$2b$10$...' WHERE username='testadmin';
-- -------------------------------------------------------------------------

INSERT INTO `admins`
  (`username`, `password_hash`, `first_name`, `last_name`, `email`, `role`, `is_active`)
VALUES
  ('superadmin',
   '$2b$10$PLACEHOLDER_REPLACE_WITH_REAL_HASH_FROM_bcrypt_Admin1234_hh',
   'Super', 'Admin', 'superadmin@yru.ac.th', 'super_admin', 1),
  ('testadmin',
   '$2b$10$PLACEHOLDER_REPLACE_WITH_REAL_HASH_FROM_bcrypt_Admin1234_hh',
   'Test', 'Admin', 'testadmin@yru.ac.th', 'admin', 1)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name  = VALUES(last_name),
  email      = VALUES(email),
  role       = VALUES(role),
  is_active  = VALUES(is_active);


-- =============================================================================
-- 2) activities — 3 รายการ (published/draft/completed)
-- =============================================================================
INSERT INTO `activities`
  (`title`, `slug`, `description`, `location`, `start_date`, `end_date`,
   `capacity`, `status`, `cover_image_url`, `created_by`)
VALUES
  ('Prompt Engineering ขั้นสูง',
   'prompt-eng-2568',
   'เทคนิคการเขียน Prompt เพื่อสั่งงาน LLM ให้ได้ผลลัพธ์ตามต้องการ พร้อม workshop ปฏิบัติจริง',
   'ห้อง Lab AI Center มหาวิทยาลัยราชภัฏยะลา',
   '2569-01-20 09:00:00', '2569-01-20 16:30:00',
   25, 'published',
   'https://picsum.photos/seed/prompt-eng/1200/400',
   (SELECT id FROM admins WHERE username = 'superadmin' LIMIT 1)),

  ('Deep Learning และ Neural Networks',
   'deep-learning-2569',
   'ทำความเข้าใจ Neural Network, CNN, RNN และการสร้างโมเดลด้วย TensorFlow/PyTorch',
   'ห้อง Lab AI Center',
   '2569-03-10 09:00:00', '2569-03-13 16:30:00',
   15, 'draft',
   NULL,
   (SELECT id FROM admins WHERE username = 'testadmin' LIMIT 1)),

  ('พื้นฐาน AI สำหรับผู้เริ่มต้น',
   'ai-basic-2568-q3',
   'เรียนรู้แนวคิดพื้นฐานของปัญญาประดิษฐ์ ประเภทของ AI และการประยุกต์ใช้ในชีวิตประจำวัน',
   'ห้องประชุมชั้น 3 อาคาร AI Center',
   '2568-10-15 09:00:00', '2568-10-16 16:30:00',
   30, 'completed',
   'https://picsum.photos/seed/ai-intro/1200/400',
   (SELECT id FROM admins WHERE username = 'superadmin' LIMIT 1))
ON DUPLICATE KEY UPDATE
  title       = VALUES(title),
  description = VALUES(description),
  location    = VALUES(location),
  status      = VALUES(status);


-- =============================================================================
-- 3) participants — 5 คน
-- =============================================================================
INSERT INTO `participants`
  (`first_name`, `last_name`, `email`, `phone`, `organization`, `position`)
VALUES
  ('สมชาย',      'ใจดี',        'somchai.j@example.com',   '0812345678', 'มหาวิทยาลัยราชภัฏยะลา', 'อาจารย์'),
  ('สมหญิง',     'รักเรียน',    'somying.r@example.com',   '0898765432', 'โรงเรียนคณะราษฎรบำรุง', 'ครู'),
  ('อาลี',       'ฮะซัน',       'ali.h@example.com',       '0865551234', 'ศูนย์ ICT ยะลา',        'นักพัฒนา'),
  ('นูรฟาติมะห์', 'สาแม',        'nurfa.s@example.com',     '0821112222', 'มหาวิทยาลัยฟาฏอนี',     'นักศึกษา'),
  ('อภิชาติ',    'ประเสริฐ',    'apichat.p@example.com',   '0834445555', 'บริษัท SME พาณิชย์',    'ผู้ประกอบการ')
ON DUPLICATE KEY UPDATE
  first_name   = VALUES(first_name),
  last_name    = VALUES(last_name),
  phone        = VALUES(phone),
  organization = VALUES(organization),
  position     = VALUES(position);


-- =============================================================================
-- 4) registrations — 5 แถว สถานะคละ (pending / confirmed / attended / cancelled)
-- =============================================================================
INSERT INTO `registrations`
  (`activity_id`, `participant_id`, `registration_status`, `note`, `checked_in_at`)
VALUES
  ((SELECT id FROM activities   WHERE slug  = 'ai-basic-2568-q3'),
   (SELECT id FROM participants WHERE email = 'somchai.j@example.com'),
   'attended',
   NULL,
   '2568-10-15 08:45:00'),

  ((SELECT id FROM activities   WHERE slug  = 'ai-basic-2568-q3'),
   (SELECT id FROM participants WHERE email = 'somying.r@example.com'),
   'attended',
   'ต้องการเน้นการนำไปใช้ในห้องเรียน',
   '2568-10-15 08:52:00'),

  ((SELECT id FROM activities   WHERE slug  = 'prompt-eng-2568'),
   (SELECT id FROM participants WHERE email = 'ali.h@example.com'),
   'confirmed',
   NULL,
   NULL),

  ((SELECT id FROM activities   WHERE slug  = 'prompt-eng-2568'),
   (SELECT id FROM participants WHERE email = 'nurfa.s@example.com'),
   'pending',
   'อยากให้ยืนยันสิทธิ์โดยเร็ว',
   NULL),

  ((SELECT id FROM activities   WHERE slug  = 'prompt-eng-2568'),
   (SELECT id FROM participants WHERE email = 'apichat.p@example.com'),
   'cancelled',
   'ติดภารกิจ ไม่สามารถเข้าอบรมได้',
   NULL)
ON DUPLICATE KEY UPDATE
  registration_status = VALUES(registration_status),
  note                = VALUES(note),
  checked_in_at       = VALUES(checked_in_at);


-- =============================================================================
-- 5) assessments — 1 ชุด (satisfaction survey สำหรับ ai-basic-2568-q3)
-- =============================================================================
INSERT INTO `assessments`
  (`activity_id`, `title`, `description`, `type`, `form_schema`,
   `is_published`, `open_at`, `close_at`)
VALUES
  ((SELECT id FROM activities WHERE slug = 'ai-basic-2568-q3'),
   'แบบสอบถามความพึงพอใจ — พื้นฐาน AI สำหรับผู้เริ่มต้น',
   'ขอความอนุเคราะห์ท่านตอบแบบสอบถามเพื่อนำไปพัฒนาการจัดหลักสูตรครั้งต่อไป',
   'satisfaction',
   JSON_OBJECT(
     'fields', JSON_ARRAY(
       JSON_OBJECT(
         'id',       'q1',
         'type',     'multiple_choice',
         'label',    'ความพึงพอใจต่อวิทยากรโดยรวม',
         'required', TRUE,
         'options',  JSON_ARRAY('พอใจมาก','พอใจ','ปานกลาง','ไม่พอใจ','ไม่พอใจมาก')
       ),
       JSON_OBJECT(
         'id',       'q2',
         'type',     'multiple_choice',
         'label',    'ความพึงพอใจต่อเนื้อหาหลักสูตร',
         'required', TRUE,
         'options',  JSON_ARRAY('พอใจมาก','พอใจ','ปานกลาง','ไม่พอใจ','ไม่พอใจมาก')
       ),
       JSON_OBJECT(
         'id',       'q3',
         'type',     'checkboxes',
         'label',    'หัวข้อที่อยากให้จัดในครั้งต่อไป (เลือกได้มากกว่า 1)',
         'required', FALSE,
         'options',  JSON_ARRAY('Machine Learning','Deep Learning','Computer Vision','NLP','AI Ethics','MLOps')
       ),
       JSON_OBJECT(
         'id',        'q4',
         'type',      'paragraph',
         'label',     'ข้อเสนอแนะเพิ่มเติม',
         'required',  FALSE,
         'validation', JSON_OBJECT('maxLength', 2000)
       )
     )
   ),
   1,
   '2568-10-16 00:00:00',
   '2568-11-15 23:59:59')
ON DUPLICATE KEY UPDATE
  title        = VALUES(title),
  description  = VALUES(description),
  form_schema  = VALUES(form_schema),
  is_published = VALUES(is_published),
  open_at      = VALUES(open_at),
  close_at     = VALUES(close_at);


-- =============================================================================
-- 6) assessment_responses — 2 คำตอบจากผู้ที่เข้าอบรมจริง
-- =============================================================================
INSERT INTO `assessment_responses`
  (`assessment_id`, `participant_id`, `response_data`, `score`)
VALUES
  ((SELECT a.id
      FROM assessments a
      JOIN activities  act ON act.id = a.activity_id
     WHERE act.slug = 'ai-basic-2568-q3'
     LIMIT 1),
   (SELECT id FROM participants WHERE email = 'somchai.j@example.com'),
   JSON_OBJECT(
     'q1', 'พอใจมาก',
     'q2', 'พอใจ',
     'q3', JSON_ARRAY('Machine Learning', 'NLP'),
     'q4', 'เนื้อหาดี อยากให้จัดคอร์ส Machine Learning ต่อ'
   ),
   NULL),

  ((SELECT a.id
      FROM assessments a
      JOIN activities  act ON act.id = a.activity_id
     WHERE act.slug = 'ai-basic-2568-q3'
     LIMIT 1),
   (SELECT id FROM participants WHERE email = 'somying.r@example.com'),
   JSON_OBJECT(
     'q1', 'พอใจ',
     'q2', 'พอใจมาก',
     'q3', JSON_ARRAY('AI Ethics'),
     'q4', 'อยากได้ตัวอย่างการใช้ในห้องเรียนเพิ่มเติม'
   ),
   NULL)
ON DUPLICATE KEY UPDATE
  response_data = VALUES(response_data),
  score         = VALUES(score);


-- =============================================================================
-- 7) certificates — 1 แถว (คุณสมชายที่เข้าอบรม + ส่งแบบประเมินแล้ว)
-- =============================================================================
INSERT INTO `certificates`
  (`registration_id`, `certificate_code`, `template_data`, `file_url`)
VALUES
  ((SELECT r.id
      FROM registrations r
      JOIN activities   a ON a.id = r.activity_id
      JOIN participants p ON p.id = r.participant_id
     WHERE a.slug = 'ai-basic-2568-q3'
       AND p.email = 'somchai.j@example.com'
     LIMIT 1),
   'YRU-AI-2568-000001',
   JSON_OBJECT(
     'name',              'ใบรับรองการอบรม AI Center YRU',
     'template',          'classic',
     'backgroundImageUrl', NULL,
     'signatureImageUrl',  NULL,
     'signerName',        'ดร. สมชาย เจริญสุข',
     'signerPosition',    'ผู้อำนวยการศูนย์ AI YRU',
     'elements', JSON_ARRAY(
       JSON_OBJECT(
         'id','e1','kind','text','content','CERTIFICATE OF COMPLETION',
         'x',15,'y',12,'width',70,'fontSize',14,'fontWeight','normal',
         'color','#9ca3af','textAlign','center','letterSpacing',4,
         'fontFamily','"Playfair Display", serif'
       ),
       JSON_OBJECT(
         'id','e2','kind','text','content','ใบรับรองการอบรม',
         'x',15,'y',20,'width',70,'fontSize',32,'fontWeight','bold',
         'color','#ffffff','textAlign','center',
         'fontFamily','"Noto Serif Thai", serif'
       ),
       JSON_OBJECT(
         'id','e3','kind','text','content','มอบให้กับ',
         'x',20,'y',36,'width',60,'fontSize',14,'fontWeight','normal',
         'color','#d1d5db','textAlign','center',
         'fontFamily','"Sarabun", sans-serif'
       ),
       JSON_OBJECT(
         'id','e4','kind','placeholder','field','participantName',
         'x',15,'y',44,'width',70,'fontSize',32,'fontWeight','bold',
         'color','#ffffff','textAlign','center',
         'fontFamily','"Charmonman", cursive'
       ),
       JSON_OBJECT(
         'id','e5','kind','text','content','เพื่อรับรองว่าได้ผ่านการอบรมหลักสูตร',
         'x',15,'y',62,'width',70,'fontSize',13,'fontWeight','normal',
         'color','#d1d5db','textAlign','center',
         'fontFamily','"Sarabun", sans-serif'
       ),
       JSON_OBJECT(
         'id','e6','kind','placeholder','field','courseTitle',
         'x',15,'y',68,'width',70,'fontSize',18,'fontWeight','bold',
         'color','#f472b6','textAlign','center',
         'fontFamily','"Prompt", sans-serif'
       ),
       JSON_OBJECT(
         'id','e7','kind','placeholder','field','issueDate',
         'x',20,'y',82,'width',25,'fontSize',11,'fontWeight','normal',
         'color','#9ca3af','textAlign','left',
         'fontFamily','"Sarabun", sans-serif'
       ),
       JSON_OBJECT(
         'id','e8','kind','placeholder','field','certificateId',
         'x',55,'y',82,'width',25,'fontSize',11,'fontWeight','normal',
         'color','#9ca3af','textAlign','right',
         'fontFamily','"Sarabun", sans-serif'
       )
     )
   ),
   NULL)
ON DUPLICATE KEY UPDATE
  template_data = VALUES(template_data),
  file_url      = VALUES(file_url);


-- =============================================================================
-- ตรวจสอบผลลัพธ์ (run manual)
-- =============================================================================
--
--  SELECT COUNT(*) AS n FROM admins;                -- expect 2
--  SELECT COUNT(*) AS n FROM activities;            -- expect 3
--  SELECT COUNT(*) AS n FROM participants;          -- expect 5
--  SELECT COUNT(*) AS n FROM registrations;         -- expect 5
--  SELECT COUNT(*) AS n FROM assessments;           -- expect 1
--  SELECT COUNT(*) AS n FROM assessment_responses;  -- expect 2
--  SELECT COUNT(*) AS n FROM certificates;          -- expect 1
--
--  SELECT * FROM v_activity_summary;
--
-- End of 03_seed_data.sql
