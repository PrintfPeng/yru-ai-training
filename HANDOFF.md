# HANDOFF — AI Center YRU (yru-ai-training)

> เอกสารส่งต่อสำหรับแชทใหม่ — อ่านไฟล์นี้ก่อนเริ่มทำงานต่อ
> อัพเดตล่าสุด: 2026-10-02

---

## 0) อ่านตรงนี้ก่อน (TL;DR)

- โปรเจกต์: ระบบจัดการอบรม AI Center มหาวิทยาลัยราชภัฏยะลา (React + Vite / Node Express / MySQL 8)
- **Production ใช้งานจริงแล้ว:** https://aicenter.yru.ac.th
- GitHub: https://github.com/PrintfPeng/yru-ai-training (branch `main`)
- Deploy ล่าสุด commit: `715257d`
- **สื่อสารกับผู้ใช้เป็นภาษาไทย** (มี skill `concise-thai` เปิดอยู่ — ตอบสั้น กระชับ ภาษาไทย ใช้อังกฤษเท่าที่จำเป็น)
- ผู้ใช้ไม่มี `gh` auth บนเครื่อง → เปิด/merge PR ไม่ได้ผ่าน CLI แต่ **push ตรง main ได้** (ใช้ workflow push→pull→deploy ตรง ๆ ไม่ผ่าน PR)

---

## 1) สถาปัตยกรรม Production (ปัจจุบัน — CloudPanel)

IT ของ YRU จัดให้เป็น CloudPanel Node.js site บน server ภายใน

| รายการ | ค่า |
|--------|-----|
| URL | https://aicenter.yru.ac.th |
| Public IP | 202.29.32.163 (block จาก Wi-Fi นักศึกษา — ใช้ไม่ได้) |
| **Internal IP** | **10.10.2.163** (เข้าได้จาก Wi-Fi/LAN YRU) |
| Panel | CloudPanel ที่ https://host163.yru.ac.th |
| Doc root | `/home/aicenter/htdocs/aicenter.yru.ac.th/` |
| Node | 20 LTS (ผ่าน nvm ที่ `/home/aicenter/.nvm`) |
| **App port** | **3008** (CloudPanel nginx reverse proxy → 127.0.0.1:3008) |
| Process manager | PM2 (`yru-api`) |
| DB | MySQL `127.0.0.1:3306`, database `aicenter-maindb`, user `aicenter-aiapp` |
| SSL | Let's Encrypt (auto, exp Dec 29 2026) |

### SSH เข้า server
```bash
ssh aicenter-yru-website@10.10.2.163
```
- user SSH: `aicenter-yru-website` (คนละตัวกับ site owner `aicenter`)
- รหัส SSH / รหัส DB / รหัส admin: **ผู้ใช้เก็บเอง ไม่อยู่ในไฟล์นี้** (ถ้าลืม → reset ใน CloudPanel)
- โน้ต: pm2/node ไม่ auto-load ใน shell ของ SSH user นี้ — ต้อง `export PATH="/home/aicenter/.nvm/versions/node/v20.20.2/bin:$PATH"` (เพิ่มใน ~/.bashrc แล้ว แต่ถ้าใช้ไม่ได้ให้ source เอง)

### nginx vhost (ตั้งโดย CloudPanel)
- `location /` → `proxy_pass http://127.0.0.1:3008/` (backend serve ทั้ง `/api` และ frontend `dist/`)
- **ไม่ต้องแก้ vhost** — backend Express serve static `dist/` + API ในตัวเดียว

---

## 2) Workflow Deploy (สำคัญ)

**ที่เครื่อง local (ผม = Claude):**
```bash
# แก้โค้ด → commit → push ตรง main (ไม่ผ่าน PR เพราะ gh ไม่ auth)
git add <files>
git commit -m "..."   # ลงท้าย Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
git push origin main
```

**บน server (ผู้ใช้รันเอง — ผมไม่มี SSH):**
```bash
cd /home/aicenter/htdocs/aicenter.yru.ac.th
git pull origin main
npm run build            # เฉพาะเมื่อแก้ frontend (src/)
pm2 restart yru-api
curl -sS http://127.0.0.1:3008/api/health; echo
```
- แก้เฉพาะ **backend/** → ข้าม `npm run build` ได้ (แค่ pm2 restart)
- แก้ **frontend src/** → ต้อง build
- มี **DB migration** → รัน `.sql` ก่อน (ดู db/migrations/)

### Preview local (ที่เครื่องผู้ใช้)
- `npm run dev` → `localhost:5173`
- `vite.config.js` proxy `/api` → **https://aicenter.yru.ac.th** (production) — เพิ่งแก้ให้ชี้ server ใหม่ (เดิมชี้ 10.20.41.108 เก่า ทำให้เห็นคนละ DB)
- ⚠ **vite.config.js ยังไม่ commit** — commit ด้วยถ้ายืนยันว่าถูก

---

## 3) โครงสร้างโปรเจกต์

```
yru-ai-training/
├── src/                          # FRONTEND (React 18 + Vite + Tailwind)
│   ├── main.jsx                  # entry + <ThemeProvider>
│   ├── App.jsx                   # view router (?view= + ?e= trainee + ?a= activity)
│   ├── index.css                 # global + html.admin-scale{font-size:120%}
│   ├── api/                      # axios wrappers (client.js + per-resource + index.js)
│   ├── contexts/ThemeContext.jsx # dark/light + localStorage
│   ├── components/
│   │   ├── ThemeToggle.jsx
│   │   ├── DynamicFormBuilder.jsx  # สร้างคำถาม 8 ประเภท
│   │   ├── CertificateEditor.jsx   # ออกแบบ cert (drag/resize/upload bg)
│   │   └── Hero/Features/Footer.jsx (public landing)
│   └── pages/
│       ├── AdminLogin.jsx
│       ├── AdminDashboard.jsx    # sidebar 3 เมนู: ภาพรวม/จัดการหลักสูตร/จัดการจองห้อง
│       │                         #   + ภาพรวม = stat cards + recent table (real API)
│       ├── CreateActivity.jsx    # สร้างกิจกรรม (ปุ่มบันทึกลอยขวาล่าง)
│       ├── ManageActivities.jsx  # ★ card grid → คลิก → detail panel 3 แท็บ:
│       │                         #   [แก้ไขรายละเอียด][ผู้ลงทะเบียน][แบบประเมิน+ใบรับรอง]
│       │                         #   + QRModal ถูกลบออกแล้ว
│       ├── ActivityRegistrants.jsx # รายชื่อผู้สมัคร + อนุมัติ/ปฏิเสธ/ลบ + CSV export
│       │                         #   prop `embedded` ซ่อน header ตอนฝังใน tab
│       ├── CreateAssessment.jsx  # แบบประเมิน + cert (prop activity+embedded)
│       │                         #   โหลด existing assessment on mount + UPDATE/CREATE
│       ├── TrainingActivity.jsx  # public: รายการหลักสูตร (filter published)
│       ├── ActivityDetail.jsx    # public: รายละเอียด + ฟอร์มสมัคร + ปุ่มทำแบบประเมิน
│       ├── EventLanding.jsx      # trainee: ใส่เบอร์ยืนยันตัว (?e=slug)
│       ├── AssessmentSurvey.jsx  # trainee: ทำแบบประเมิน
│       └── CertificateDownload.jsx # trainee: โหลดใบรับรอง
│
├── backend/src/                  # BACKEND (Node 20 + Express)
│   ├── server.js                 # listen :3008 (จาก .env PORT)
│   ├── app.js                    # express + serve dist/ + JSON limit 15mb
│   ├── config/{env.js,db.js}     # Zod env + mysql2 pool
│   ├── routes/                   # validate (Zod) → controller
│   ├── controllers/              # req/res
│   ├── services/                 # business logic + SQL
│   ├── middleware/{auth,errorHandler,validator}.js
│   └── utils/{AppError,asyncHandler,slugify}.js
│
├── db/
│   ├── 01_init_schema.sql        # 7 tables + v_activity_summary view
│   │                             #   (cover_image_url + assessments.description = LONGTEXT)
│   ├── 02_create_user.sql        # ⚠ อย่า import บน CloudPanel (user สร้างใน panel แล้ว)
│   ├── 03_seed_data.sql          # admin + sample data
│   └── migrations/*.sql          # ALTER incremental (รันตอน deploy)
│
├── vite.config.js                # dev proxy /api → aicenter.yru.ac.th
└── HANDOFF.md                    # ← ไฟล์นี้
```

### API 3-layer flow
`routes (Zod validate + auth) → controllers (req/res) → services (logic + SQL)`

---

## 4) จุดสำคัญทางเทคนิค (gotchas)

1. **DB name มี `-`** (`aicenter-maindb`) → ต้อง backtick ใน SQL / connect ปกติผ่าน mysql2 ได้
2. **Import SQL บน CloudPanel**: `01_init_schema.sql` มี `CREATE DATABASE` + `USE yru_ai_training_db` ต้อง filter ออก:
   ```bash
   sed -E '/^CREATE DATABASE/,/;$/d; /^USE /d' db/01_init_schema.sql | mysql ... aicenter-maindb
   ```
3. **CERT_CONFIG**: CreateAssessment ฝัง config ใบรับรองเป็น comment ท้าย `assessment.description`:
   `<!-- CERT_CONFIG:{...json...} -->` (มี base64 bg image ได้ → ต้อง LONGTEXT)
   - Frontend `parseCertConfig` strip ตอนแสดง (AssessmentSurvey) + โหลดกลับ (CreateAssessment)
   - Backend `parseCertConfig` (assessments.service) → ส่ง template ให้ `issueCertificateForRegistration`
4. **Base64 images**: cover_image_url + cert bg เก็บเป็น data URL ใน DB (LONGTEXT) — JSON body limit = 15mb
5. **Modal ใน admin**: ใช้ `createPortal(..., document.body)` + `z-[100]` กัน sticky header บัง
6. **Admin font scale**: `html.admin-scale { font-size: 120% }` (AdminDashboard ใส่ class ตอน mount)
7. **URL state**: F5 ไม่เด้งหน้าแรกแล้ว — App.jsx sync `?view=`, TrainingActivity sync `?a=<slug>`
8. **No rate limit** บน verify-phone แล้ว (เอาออกตามคำขอผู้ใช้)

---

## 5) งานที่เพิ่งทำเสร็จ (recent commits)

- `715257d` ปุ่มบันทึกกิจกรรมลอยขวาล่าง
- `1186348` cert ออกตาม template admin (ไม่ใช่ default) — parse CERT_CONFIG ตอน submit
- `9f08b4a` CreateAssessment โหลด existing + UPDATE/CREATE + description LONGTEXT
- `0be26ee` strip CERT_CONFIG ออกจากแบนเนอร์ description
- `7ac306b` fix React #310 (hooks above early return) ใน AssessmentSurvey
- `eec0c07` เอา rate limit verify-phone ออก
- `cd91d71` sync view state กับ URL (F5 ไม่เด้ง)

---

## 6) 🔴 งานค้าง / กำลังเทส

### A. เทสใบรับรอง custom bg (in-progress)
เพิ่ง deploy fix `1186348` + ลบ cert เก่าใน DB แล้ว กำลังรอผู้ใช้เทส flow:
1. Admin upload bg ใน tab "แบบประเมิน + ใบรับรอง" → บันทึก
2. Trainee ทำแบบประเมิน → cert ที่ได้ **ต้องมี bg ที่ admin ออกแบบ**

ถ้ายังไม่ขึ้น bg → debug:
```bash
# เช็ค template_data ของ cert ล่าสุดมี backgroundImageUrl ไหม
DB_PASS=$(grep '^DB_PASSWORD' backend/.env | cut -d= -f2-)
mysql -h 127.0.0.1 -u aicenter-aiapp -p"$DB_PASS" aicenter-maindb -e \
 "SELECT id, LEFT(JSON_EXTRACT(template_data,'\$.backgroundImageUrl'),40) FROM certificates ORDER BY id DESC LIMIT 3;"
```
- ถ้า NULL → assessment.description ไม่มี CERT_CONFIG หรือ parse พลาด (เช็ค assessments.description)
- ถ้ามี data: → ปัญหาที่ CertificateDownload render (cert.backgroundImageUrl)

### B. vite.config.js ยังไม่ commit
แก้ default proxy → `https://aicenter.yru.ac.th` (จากเดิม 10.20.41.108) ยังไม่ push

### C. Security — ทำแล้ว (ยืนยันกับผู้ใช้ว่าครบ)
- ✅ เปลี่ยนรหัส DB (จาก `aicenterdb2569` ที่หลุด chat → ใหม่)
- ✅ เปลี่ยนรหัส admin superadmin (จาก Admin@1234 → ใหม่)
- ⚠ JWT_SECRET ใน .env เคยหลุด chat (`3bb9fca...`) — ถ้าจะให้ชัวร์ regenerate: `openssl rand -hex 24` → แก้ .env → pm2 restart (session admin ทั้งหมดจะหลุด)

---

## 7) Server เก่า (ยังรันอยู่ ไม่ได้ใช้แล้ว)
- 10.20.41.108 (Ubuntu + pm2 + MySQL) — deploy ชุดเดิมไว้ ยังมี `~/deploy.sh`
- **ไม่ใช้แล้ว** — production ย้ายมา CloudPanel (10.10.2.163) หมดแล้ว
- ถ้าจะปิด: `pm2 delete yru-api` บน 10.20.41.108 (ไม่เร่งด่วน)

---

## 8) บัญชีทดสอบ
- Admin: `superadmin` / รหัสที่ผู้ใช้เปลี่ยนใหม่ (ไม่ใช่ Admin@1234 แล้ว)
- Trainee flow: scan `?e=<activity-slug>` → ใส่เบอร์ที่ลงทะเบียน (status ต้อง confirmed/attended)

---

## วิธีใช้ไฟล์นี้ในแชทใหม่
บอกแชทใหม่ว่า: "อ่าน `D:\All-Source-Code\AI-CENTER-TRANING\HANDOFF.md` แล้วทำงานต่อ"
แล้วบอกงานที่ต้องการ เช่น "เทสใบรับรองต่อ" หรือ "แก้ feature X"
