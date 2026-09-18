# Database Layer — yru-ai-training

MySQL 8.0+ schema, permissions, and seed data.

## Run order

```bash
# 1) Schema (rerunnable)
mysql -u root -p < 01_init_schema.sql

# 2) App user + grants — edit password placeholders first!
#    sed -i "s/<<CHANGE_ME_STRONG_PASSWORD>>/$(openssl rand -base64 24)/g" 02_create_user.sql
mysql -u root -p < 02_create_user.sql

# 3) Seed demo data (rerunnable)
mysql -u root -p yru_ai_training_db < 03_seed_data.sql

# 4) Replace placeholder bcrypt hash for admins (Admin@1234)
cd ..
npm install --no-save bcrypt
HASH=$(node -e "require('bcrypt').hash('Admin@1234', 10).then(h => console.log(h))")
mysql -u root -p yru_ai_training_db -e "
  UPDATE admins SET password_hash='$HASH' WHERE username IN ('superadmin','testadmin');
"
```

## Files

| File                    | Purpose                                          |
|-------------------------|--------------------------------------------------|
| `01_init_schema.sql`    | Creates database + 7 tables + `v_activity_summary` view. Idempotent. |
| `02_create_user.sql`    | Creates `yru_app_user` on `localhost` + `10.20.41.%` with DML-only grants. |
| `03_seed_data.sql`      | Inserts 2 admins, 3 activities, 5 participants, 5 registrations, 1 assessment (+ 2 responses), 1 certificate. |

## Tables

1. **admins** — ผู้ดูแลระบบ (super_admin / admin / staff)
2. **activities** — หลักสูตร/กิจกรรม
3. **participants** — ผู้เข้าอบรม (คนกลาง)
4. **registrations** — ตารางกลาง M:N ระหว่าง activities × participants
5. **assessments** — แบบสอบถาม (dynamic form, JSON schema)
6. **assessment_responses** — คำตอบผู้เข้าอบรม
7. **certificates** — วุฒิบัตร (พร้อม snapshot template_data)

## JSON schemas

Full field-level docs live inline as SQL comments at the top of each JSON column
(see `01_init_schema.sql` sections 5 and 7).

- `assessments.form_schema`  → `{ fields: [{ id, type, label, required, options?, validation? }] }`
- `assessment_responses.response_data` → `{ [fieldId]: value }`
- `certificates.template_data` → `{ name, template, backgroundImageUrl, signatureImageUrl, signerName, signerPosition, elements: [{...}] }`

## Design notes

- **Capacity check** is enforced in the application layer (Node.js) via
  `SELECT ... FOR UPDATE` inside a transaction — not in a trigger.
  See long comment at the end of `01_init_schema.sql`.
- **Auth plugin** for the app user is `caching_sha2_password` (MySQL 8 default,
  works with mysql2 driver v2.1+). Fallback to `mysql_native_password` shown
  as commented `ALTER USER` in `02_create_user.sql`.
- **Timezone** is Asia/Bangkok — set via `SET TIME_ZONE = '+07:00'` at the top
  of every script. Make sure the backend pool config passes `timezone: '+07:00'`.
