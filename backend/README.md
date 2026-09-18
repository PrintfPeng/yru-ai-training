# yru-ai-training — Backend API

Express 4 + MySQL 8 + JWT (httpOnly cookie), ESM, Node.js 20+.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — DB_PASSWORD, JWT_SECRET, CORS_ORIGINS
npm run dev       # nodemon on src/server.js  → http://localhost:3000
```

The server refuses to start until the DB is reachable, so make sure
`db/01_init_schema.sql`, `db/02_create_user.sql`, `db/03_seed_data.sql`
have been applied first.

## Project layout

```
src/
├── server.js               ← entry (boots pool, listens, graceful shutdown)
├── app.js                  ← Express app + middlewares
├── config/
│   ├── env.js              ← zod-validated env
│   └── db.js               ← mysql2 pool + withTransaction() helper
├── middleware/
│   ├── auth.js             ← requireAuth / requireRole / issueToken
│   ├── errorHandler.js     ← notFoundHandler + errorHandler
│   └── validator.js        ← zod schema runner
├── utils/
│   ├── AppError.js         ← uniform error with code/status/details
│   ├── asyncHandler.js
│   └── slugify.js          ← slugify + normalizePhone + makeCertificateCode
├── routes/
│   ├── index.js
│   ├── auth.routes.js
│   ├── activities.routes.js
│   ├── participants.routes.js
│   ├── registrations.routes.js
│   ├── assessments.routes.js
│   └── certificates.routes.js
├── controllers/            ← thin: parse, call service, respond
└── services/               ← business logic + all DB queries
```

**Rule:** controllers never call `pool.query`. Only services do.

## Endpoints

All under `/api`. `{ ok, data }` on success, `{ ok:false, error:{ code, message, details? } }` on failure.

### Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | – | Set httpOnly JWT cookie |
| POST | `/api/auth/logout` | admin | Clear cookie |
| GET  | `/api/auth/me` | admin | Current admin profile |

### Activities
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/activities?status=&limit=&offset=` | – | List (with summary counts) |
| GET  | `/api/activities/slug/:slug` | – | Fetch by slug (QR flow) |
| GET  | `/api/activities/:id` | – | Fetch by id |
| POST | `/api/activities` | admin | Create |
| PATCH| `/api/activities/:id` | admin | Partial update |
| DELETE| `/api/activities/:id` | super_admin | Delete |

### Participants
| Method | Path | Auth |
|---|---|---|
| GET  | `/api/participants?q=&limit=&offset=` | admin |
| GET  | `/api/participants/:id` | admin |
| PATCH| `/api/participants/:id` | admin |
| DELETE| `/api/participants/:id` | super_admin |

### Registrations
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/registrations/public/activity/:slug/register` | – | Public register (ActivityDetail form). Enforces capacity via `SELECT ... FOR UPDATE`. |
| POST | `/api/registrations/public/activity/:slug/verify-phone` | – | Trainee QR flow: verify phone → returns participant (masked). Rate-limited 5/15min. |
| GET  | `/api/registrations/by-activity/:id?status=` | admin | Admin registrant list |
| PATCH| `/api/registrations/:id/status` | admin | Approve / reject / mark attended |
| DELETE| `/api/registrations/:id` | super_admin | Delete |

### Assessments
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/assessments/by-activity/:id` | admin | List assessments of an activity |
| POST | `/api/assessments/by-activity/:id` | admin | Create assessment |
| GET  | `/api/assessments/:id` | admin | Get one |
| PATCH| `/api/assessments/:id` | admin | Update |
| DELETE| `/api/assessments/:id` | super_admin | Delete |
| GET  | `/api/assessments/public/activity/:slug/active` | – | Trainee flow: fetch active survey |
| POST | `/api/assessments/:id/public/submit` | – | Trainee flow: submit answers. Auto-issues certificate + flips registration to `attended` in one transaction. |

### Certificates
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/certificates/public/:code` | – | Verify by code (`YRU-AI-YYYY-NNNNNN`). Returns cert template + substitutions. |

### Health
`GET /api/health` — `{ ok: true, service, time }`

## Trainee flow (mapped to frontend pages)

| Frontend page | Backend call |
|---|---|
| `EventLanding` — phone step | `POST /registrations/public/activity/:slug/verify-phone` |
| `EventLanding` — confirm    | (client-only, uses the returned participant) |
| `AssessmentSurvey` — load   | `GET  /assessments/public/activity/:slug/active` |
| `AssessmentSurvey` — submit | `POST /assessments/:id/public/submit` → returns certificate |
| `CertificateDownload`       | `GET  /certificates/public/:code` (also used for `/verify/:code`) |

## Admin flow

| Frontend page | Backend call |
|---|---|
| `AdminLogin`          | `POST /auth/login` |
| `AdminDashboard`      | `GET  /auth/me`, `GET /activities` |
| `CreateActivity`      | `POST /activities`, `POST /assessments/by-activity/:id` |
| `ManageActivities`    | `GET/PATCH/DELETE /activities/:id` |
| `ActivityRegistrants` | `GET  /registrations/by-activity/:id`, `PATCH /registrations/:id/status` |
| `CreateAssessment`    | `POST/PATCH /assessments/...` |

## Design notes

- **Least-privilege DB user** (`yru_app_user`) with only `SELECT/INSERT/UPDATE/DELETE` — set up in `db/02_create_user.sql`.
- **Capacity check** happens inside `withTransaction` + `SELECT ... FOR UPDATE` (see `services/registrations.service.js`). No trigger; rationale is in `db/01_init_schema.sql`.
- **JWT in httpOnly cookie** — safer than localStorage against XSS. Frontend must call fetch/axios with `credentials: 'include'`.
- **Errors** — always `AppError('CODE', 'message', status, details?)`. Frontend switches on `error.code`.
- **Timezone** — pool created with `timezone: '+07:00'`; DB scripts also set `SET TIME_ZONE = '+07:00'`. `DATETIME` columns round-trip as Bangkok time.
- **Rate limit** — public phone verify is limited to `PUBLIC_RATE_LIMIT_MAX` per `PUBLIC_RATE_LIMIT_WINDOW_MS` (default 5/15min) per IP.
