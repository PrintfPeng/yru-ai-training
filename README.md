# YRU AI Center — ระบบจัดการอบรม

ระบบลงทะเบียนอบรม / แบบประเมิน / ออกใบรับรอง ของศูนย์ปัญญาประดิษฐ์ มหาวิทยาลัยราชภัฏยะลา
Production: https://aicenter.yru.ac.th

> เอกสารนี้สำหรับ **เริ่มต้นพัฒนา** (เหมาะกับคนที่ยังไม่เคยใช้ React / Node.js)
> ส่วนการ deploy ขึ้น server จริง ดูที่ [`HANDOFF.md`](HANDOFF.md)

---

## 1) เทคโนโลยีที่ใช้ (รู้คร่าว ๆ พอ)

| ส่วน | ใช้อะไร | ทำหน้าที่ |
|------|---------|-----------|
| Frontend | **React 18 + Vite + Tailwind CSS** | หน้าเว็บทั้งหมด (ที่ผู้ใช้เห็น) |
| Backend | **Node.js 20 + Express** | REST API (`/api/...`) |
| Database | **MySQL 8** | เก็บข้อมูล |

- **Vite** = ตัวรัน/บิลด์ frontend (สั่ง `npm run dev` แล้วเปิดเว็บที่ `localhost:5173`)
- **Express** = เซิร์ฟเวอร์ API ฝั่ง backend (รันที่ `localhost:3000`)
- Frontend กับ Backend เป็นคนละโปรแกรม คุยกันผ่าน HTTP (`/api`)

---

## 2) ต้องติดตั้งอะไรก่อน (ครั้งเดียว)

ติดตั้ง 3 อย่างนี้ก่อน (กดลิงก์โหลดได้เลย):

1. **Node.js 20 LTS** — https://nodejs.org (เลือกเวอร์ชัน LTS)
   - ตรวจว่าติดตั้งสำเร็จ: เปิด Terminal/CMD พิมพ์ `node -v` ควรขึ้น `v20.x.x`
2. **Git** — https://git-scm.com/downloads
   - ตรวจ: `git --version`
3. **MySQL 8** *(เฉพาะโหมด B — ถ้าจะรัน backend เอง)* — https://dev.mysql.com/downloads/installer/
   - แนะนำติดตั้ง **MySQL Workbench** หรือ **DBeaver** มาด้วย จะได้มีหน้าจอจัดการ DB

แนะนำ **VS Code** เป็น editor: https://code.visualstudio.com

---

## 3) โครงสร้างโปรเจกต์

```
AI-CENTER-TRANING/
├── src/                         # ★ FRONTEND (React)
│   ├── main.jsx                 # จุดเริ่มของแอป
│   ├── App.jsx                  # ตัวสลับหน้า (อ่าน ?view= / ?e= / ?a= / ?verify= จาก URL)
│   ├── index.css                # style รวม (Tailwind)
│   ├── api/                     # ตัวเรียก API (axios) แยกตามเรื่อง
│   │   ├── client.js            #   axios instance กลาง (baseURL, แกะ { ok, data })
│   │   ├── activities.js        #   กิจกรรม/หลักสูตร
│   │   ├── registrations.js     #   การลงทะเบียน
│   │   ├── assessments.js       #   แบบประเมิน
│   │   ├── certificates.js      #   ใบรับรอง
│   │   ├── auth.js  participants.js
│   │   └── index.js             #   รวม export
│   ├── contexts/ThemeContext.jsx# โหมดมืด/สว่าง
│   ├── utils/thaiDate.js        # ฟอร์แมตวันที่ไทย (พ.ศ.) — อย่าใช้ toLocaleDateString ตรง ๆ
│   ├── components/              # ชิ้นส่วน UI ที่ใช้ซ้ำ
│   │   ├── DynamicFormBuilder.jsx#   ตัวสร้างคำถาม (รวม rating matrix)
│   │   ├── CertificateEditor.jsx #   ออกแบบใบรับรอง (drag/resize/อัปโหลด bg)
│   │   └── Hero/Features/Footer/ThemeToggle.jsx
│   └── pages/                   # หน้าจอหลัก
│       ├── TrainingActivity.jsx #   public: รายการหลักสูตร
│       ├── ActivityDetail.jsx   #   public: รายละเอียดหลักสูตร + ฟอร์มสมัคร
│       ├── EventLanding.jsx     #   trainee: ยืนยันเบอร์ (?e=slug)
│       ├── AssessmentSurvey.jsx #   trainee: ทำแบบประเมิน
│       ├── CertificateDownload.jsx#  trainee: ดู/โหลดใบรับรอง (PDF) + หน้า ?verify=
│       ├── AdminLogin.jsx  AdminDashboard.jsx
│       ├── CreateActivity.jsx  ManageActivities.jsx
│       ├── ActivityRegistrants.jsx  CreateAssessment.jsx
│       └── ...
│
├── backend/                     # ★ BACKEND (Node + Express)
│   ├── .env.example             # ตัวอย่างค่า config (คัดลอกเป็น .env)
│   └── src/
│       ├── server.js            # จุดเริ่ม — listen ที่ PORT
│       ├── app.js               # ตั้งค่า express + serve frontend (dist/) + /api
│       ├── config/{env.js,db.js}# อ่าน .env (ตรวจด้วย Zod) + สร้าง MySQL pool
│       ├── routes/              # กำหนด URL + ตรวจ input (Zod) + เช็ก auth
│       ├── controllers/         # รับ request → เรียก service → ส่ง response
│       ├── services/            # business logic + คำสั่ง SQL
│       ├── middleware/          # auth (JWT), errorHandler, validator
│       └── utils/               # AppError, asyncHandler, slugify
│
├── db/                          # ★ DATABASE
│   ├── 01_init_schema.sql       # สร้าง database + ตารางทั้งหมด
│   ├── 02_create_user.sql       # สร้าง user + สิทธิ์ (DML เท่านั้น)
│   ├── 03_seed_data.sql         # ข้อมูลตัวอย่าง + admin
│   ├── migrations/*.sql         # การแก้ schema ทีละขั้น (รันตามวันที่)
│   └── README.md                # วิธี setup DB ละเอียด
│
├── vite.config.js               # ตั้งค่า vite + proxy /api → backend
├── .env.example                 # config ฝั่ง frontend (คัดลอกเป็น .env)
├── README.md                    # ← ไฟล์นี้
└── HANDOFF.md                   # สถาปัตยกรรม + วิธี deploy production
```

**การไหลของข้อมูลฝั่ง backend:** `routes (ตรวจ input + auth) → controllers (req/res) → services (logic + SQL) → DB`

---

## 4) เริ่มพัฒนา — เลือก 1 โหมด

### 🟢 โหมด A — ง่ายสุด (ทำงานฝั่งหน้าเว็บ / UI)

ไม่ต้องลง MySQL ไม่ต้องรัน backend — frontend จะดึงข้อมูลจริงจาก server production ผ่าน proxy
เหมาะกับ: ปรับหน้าตา, แก้ component, ดูข้อมูลจริง

```bash
# 1) โคลนโปรเจกต์
git clone https://github.com/PrintfPeng/yru-ai-training.git
cd yru-ai-training

# 2) สร้างไฟล์ .env ของ frontend (ครั้งเดียว)
cp .env.example .env        # Windows (CMD): copy .env.example .env

# 3) ติดตั้ง library ของ frontend
npm install

# 4) รัน
npm run dev
```

เปิดเบราว์เซอร์ที่ **http://localhost:5173**
- อ่านข้อมูล (GET) ใช้ได้ทันที ✅
- ⚠ **ข้อจำกัด:** login admin ที่ localhost จะไม่ติด (เพราะ cookie ของ production เป็นแบบ Secure) → ถ้าต้องแก้/ทดสอบฝั่ง admin ให้ใช้ **โหมด B**

---

### 🔵 โหมด B — Full-stack (รัน backend + DB เอง)

เหมาะกับ: แก้ backend/API, ทดสอบ login admin, ทดสอบการบันทึกข้อมูล โดยไม่กระทบข้อมูลจริง

**4.1 ติดตั้ง MySQL แล้วสร้างฐานข้อมูล** (ทำครั้งเดียว)

เปิด Terminal (ที่เข้าถึง `mysql` ได้ หรือใช้ MySQL Workbench รันไฟล์ตามลำดับ):

```bash
cd db

# 1) สร้าง database + ตาราง
mysql -u root -p < 01_init_schema.sql

# 2) สร้าง user ของแอป (แก้รหัสผ่านใน 02_create_user.sql ก่อน หรือใช้ root ไปก่อนได้)
mysql -u root -p < 02_create_user.sql

# 3) ใส่ข้อมูลตัวอย่าง + admin
mysql -u root -p yru_ai_training_db < 03_seed_data.sql

# 4) รัน migration ทั้งหมด (คอลัมน์/ตารางที่เพิ่มภายหลัง) — รันไฟล์ใน migrations/ ตามชื่อวันที่
for f in migrations/*.sql; do mysql -u root -p yru_ai_training_db < "$f"; done
```

> 💡 ถ้าใช้ **MySQL Workbench/DBeaver**: เปิดไฟล์ `.sql` แต่ละอันแล้วกด Run ตามลำดับ 01 → 02 → 03 → migrations ทั้งหมด

**4.2 ตั้งรหัส admin สำหรับ login** (seed เก็บเป็น hash placeholder)

```bash
cd ../backend             # เข้าโฟลเดอร์ backend (bcryptjs อยู่ที่นี่)
npm install               # ติดตั้ง library ของ backend ก่อน
# สร้าง hash ของรหัส 'Admin@1234' แล้วอัปเดตลง DB
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Admin@1234',10))")
mysql -u root -p yru_ai_training_db -e "UPDATE admins SET password_hash='$HASH' WHERE username='superadmin';"
```

**4.3 ตั้งค่า backend/.env** (ยังอยู่ในโฟลเดอร์ `backend`)

```bash
cp .env.example .env       # Windows: copy .env.example .env
```
แก้ไฟล์ `backend/.env`:
- `DB_USER` / `DB_PASSWORD` → ให้ตรงกับที่สร้างในขั้น 4.1 (หรือใช้ `root` + รหัส root ไปก่อน)
- `JWT_SECRET` → สุ่มค่ายาว ≥ 32 ตัว: `openssl rand -hex 24` แล้วก๊อปมาวาง
- `COOKIE_SECURE=false` (สำคัญ! dev เป็น http ถ้า true จะ login ไม่ติด)

**4.4 รัน backend**

```bash
# อยู่ในโฟลเดอร์ backend
npm run dev                # รันที่ http://localhost:3000 (auto-reload)
```
ตรวจว่าใช้ได้: เปิด http://localhost:3000/api/health ควรขึ้น `{"ok":true,...}`

**4.5 ให้ frontend ชี้มาที่ backend local**

ที่ **root** โปรเจกต์ แก้ไฟล์ `.env` เพิ่มบรรทัด:
```
VITE_DEV_API_PROXY=http://localhost:3000
```
แล้วรัน frontend อีก Terminal หนึ่ง:
```bash
npm run dev                # ที่ root → http://localhost:5173
```

ตอนนี้ localhost:5173 (frontend) จะคุยกับ localhost:3000 (backend) + MySQL ของคุณเอง ครบวงจร 🎉

**บัญชี admin ทดสอบ (local):** `superadmin` / `Admin@1234`

---

## 5) คำสั่งที่ใช้บ่อย

| ที่ไหน | คำสั่ง | ทำอะไร |
|--------|--------|--------|
| root | `npm run dev` | รัน frontend (vite, :5173) |
| root | `npm run build` | บิลด์ frontend เป็นไฟล์ production (`dist/`) |
| root | `npm run lint` | ตรวจ code frontend |
| backend | `npm run dev` | รัน backend แบบ auto-reload (:3000) |
| backend | `npm start` | รัน backend ปกติ |

---

## 6) เจอปัญหาบ่อย ๆ

- **`npm install` ช้า/ค้าง** → รอให้จบ (ครั้งแรกโหลดเยอะ) หรือเช็กเน็ต
- **login admin ไม่ติดที่ localhost** → ต้องใช้โหมด B + `COOKIE_SECURE=false` (cookie Secure ใช้ไม่ได้บน http)
- **backend ขึ้น error "Invalid environment variables"** → เปิด `backend/.env` ดูว่าตั้ง `DB_*` + `JWT_SECRET` (≥32 ตัว) ครบไหม
- **`ECONNREFUSED` / ต่อ DB ไม่ได้** → MySQL ยังไม่รัน หรือ user/รหัสใน `.env` ไม่ตรง
- **วันที่ขึ้นเป็นปีแปลก ๆ (เช่น 3112)** → ใช้ `formatThaiDate` จาก `src/utils/thaiDate.js` อย่าใช้ `toLocaleDateString('th-TH')` ตรง ๆ (มันบวก 543 ซ้ำ)
- **เปลี่ยน `.env` แล้วไม่มีผล** → ต้อง **restart** `npm run dev` ใหม่ (vite อ่าน env ตอนเริ่มเท่านั้น)

---

## 7) Workflow การทำงานร่วมกัน

```bash
git pull origin main          # ดึงงานล่าสุดก่อนเริ่ม
# ... แก้โค้ด ...
git add <ไฟล์ที่แก้>
git commit -m "ข้อความอธิบายสั้น ๆ"
git push origin main
```
> ถ้าทำ feature ใหญ่ แนะนำแตก branch แยก (`git checkout -b feature/ชื่อ`) แล้วค่อยรวมภายหลัง
> การ deploy ขึ้น production ทำตาม [`HANDOFF.md`](HANDOFF.md)
