-- =============================================================================
--  YRU AI Training — Application User & Grants
--  Run  :  mysql -u root -p < 02_create_user.sql
--  หลัง run เสร็จ อย่าลืมนำ password ไปใส่ในไฟล์ .env ของ backend เป็น
--         DB_USER=yru_app_user
--         DB_PASSWORD=<CHANGE_ME_STRONG_PASSWORD>
-- =============================================================================
--
--  ทำไมต้องมี 2 host?
--  ---------------------------------------------------------------------------
--  1) 'yru_app_user'@'localhost'
--       ใช้เมื่อ backend รันบนเครื่องเดียวกับ MySQL (production case ปกติ
--       — Node.js server + MySQL อยู่บน 10.20.41.108 ตัวเดียวกัน)
--       connect ผ่าน unix socket → เร็วกว่า TCP + ปลอดภัยกว่า
--
--  2) 'yru_app_user'@'10.20.41.%'
--       ใช้เมื่อ backend รันคนละเครื่องแต่วง LAN สำนักงานเดียวกัน
--       (เช่น dev/staging backend อยู่คนละเครื่องแต่ต่อ prod DB)
--       เปิดเฉพาะ subnet 10.20.41.0/24 — ไม่เปิดกว้างเป็น '%'
--
--  Auth plugin:
--  ---------------------------------------------------------------------------
--  เลือก IDENTIFIED WITH caching_sha2_password (MySQL 8 default):
--    ✓ ปลอดภัยกว่า mysql_native_password (SHA-2 vs SHA-1)
--    ✓ mysql2 driver รองรับตั้งแต่ v2.1+ (โปรเจกต์นี้ใช้ latest ผ่าน npm)
--    ✓ ไม่ต้อง config พิเศษฝั่ง Node — ทำงานได้ทันทีถ้า OpenSSL พร้อม
--    ⚠ หมายเหตุ: caching_sha2 ต้องการ TLS หรือ RSA public key exchange
--       สำหรับ first-connect. ถ้าเจอ error 'Authentication plugin' บน mysql2
--       เก่า ให้เพิ่ม option { authPlugins: { caching_sha2_password: ... } }
--       หรือ downgrade เป็น mysql_native_password (ตัวอย่างด้านล่าง)
--
--  ถ้าอยากใช้ mysql_native_password (compat กับ mysql2 v1.x, PHP legacy):
--     ALTER USER 'yru_app_user'@'localhost'
--       IDENTIFIED WITH mysql_native_password BY '<PASSWORD>';
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Password generation (บน Linux):
--   openssl rand -base64 24
--   # หรือ pwgen -sy 24 1
--   # หรือ head -c 24 /dev/urandom | base64
-- นำ output ที่ได้มาแทน bf88c21f6237b37e974f7c130ee23974433c4a7a9f3b9169 ทั้ง 2 ที่
-- -----------------------------------------------------------------------------

/* ============================================================================
   1) สร้าง user 2 host
   ============================================================================ */
CREATE USER IF NOT EXISTS 'yru_app_user'@'localhost'
  IDENTIFIED WITH caching_sha2_password BY 'bf88c21f6237b37e974f7c130ee23974433c4a7a9f3b9169';

CREATE USER IF NOT EXISTS 'yru_app_user'@'10.20.41.%'
  IDENTIFIED WITH caching_sha2_password BY 'bf88c21f6237b37e974f7c130ee23974433c4a7a9f3b9169';

/* ถ้า user มีอยู่แล้วและอยาก reset password ให้ uncomment 2 บรรทัดนี้:
ALTER USER 'yru_app_user'@'localhost'    IDENTIFIED BY 'bf88c21f6237b37e974f7c130ee23974433c4a7a9f3b9169';
ALTER USER 'yru_app_user'@'10.20.41.%'   IDENTIFIED BY 'bf88c21f6237b37e974f7c130ee23974433c4a7a9f3b9169';
*/


/* ============================================================================
   2) GRANT สิทธิ์ (least-privilege) — เฉพาะ DML ห้าม DDL/GRANT
   ============================================================================
   ที่ให้:  SELECT, INSERT, UPDATE, DELETE                  → ทำงาน CRUD ปกติได้
   ห้าม:   CREATE/ALTER/DROP/INDEX/REFERENCES/TRIGGER      → กัน app แก้ schema
   ห้าม:   GRANT OPTION                                    → กัน privilege escalation
   ห้าม:   FILE/PROCESS/RELOAD/SUPER                       → ไม่ให้แตะ server-wide

   หมายเหตุ: ให้สิทธิ์ระดับ database (yru_ai_training_db.*) ไม่ให้ระดับ global
============================================================================ */
GRANT SELECT, INSERT, UPDATE, DELETE
  ON `yru_ai_training_db`.*
  TO 'yru_app_user'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `yru_ai_training_db`.*
  TO 'yru_app_user'@'10.20.41.%';


/* ============================================================================
   3) ถ้าอนาคตต้องใช้ migration tool (Prisma/Knex/TypeORM/Sequelize)
   ============================================================================
   แนะนำสร้าง user แยกต่างหากเฉพาะสำหรับ migration ไม่ให้ปนกับ app user:

     CREATE USER 'yru_migrator'@'localhost'
       IDENTIFIED WITH caching_sha2_password BY '<<MIGRATOR_PASSWORD>>';
     GRANT CREATE, ALTER, DROP, INDEX, REFERENCES, TRIGGER,
           EXECUTE, CREATE VIEW, CREATE ROUTINE, ALTER ROUTINE,
           SELECT, INSERT, UPDATE, DELETE
       ON `yru_ai_training_db`.*
       TO 'yru_migrator'@'localhost';

   เหตุผลที่แยก: app user compromised → attacker แก้ schema ไม่ได้
============================================================================ */


/* ============================================================================
   4) Apply
   ============================================================================ */
FLUSH PRIVILEGES;


/* ============================================================================
   5) ตรวจสอบว่า user + grants ถูกสร้างจริง
   ============================================================================
   คำสั่งพวกนี้ไม่ใช่ statement ที่ต้อง run auto — ใช้ debug/verify ทีหลัง:

     SELECT User, Host, plugin FROM mysql.user WHERE User = 'yru_app_user';
     SHOW GRANTS FOR 'yru_app_user'@'localhost';
     SHOW GRANTS FOR 'yru_app_user'@'10.20.41.%';

   คาดว่าจะเห็น:
     GRANT USAGE ON *.* TO `yru_app_user`@`localhost`
     GRANT SELECT, INSERT, UPDATE, DELETE ON `yru_ai_training_db`.* TO ...
============================================================================ */

-- End of 02_create_user.sql
