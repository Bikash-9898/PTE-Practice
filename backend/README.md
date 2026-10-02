# PTE Master Backend

REST API for the **PTE Master** frontend — a free unofficial PTE Academic
practice platform. Built with Node.js, Express, and MongoDB.

> ⚠️  This backend ships demo / sample content that is **clearly unofficial
> practice material**. It is not affiliated with Pearson PTE Academic and
> must not be marketed as such.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT in httpOnly cookie + `Authorization: Bearer` header
- **Uploads:** Multer (disk storage under `uploads/`)
- **ESM JavaScript** (no TypeScript)

## Folder layout

```
backend/
├── src/
│   ├── config/db.js              # Mongoose connection
│   ├── controllers/              # Route handlers
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # Express routers
│   ├── middleware/               # auth, admin, error, multer
│   ├── utils/                     # generateToken, scoring, responses
│   ├── seed/                      # demo data + seeder script
│   └── server.js                  # Express bootstrap
├── uploads/
│   ├── audio/                     # user-uploaded audio (created on first upload)
│   └── images/                    # user-uploaded images
├── .env.example
├── package.json
└── README.md
```

## Setup

```bash
cd backend
cp .env.example .env       # edit MONGO_URI and JWT_SECRET
npm install
npm run seed               # creates demo users + questions + mock test
npm run dev                # starts the server with nodemon
```

The server listens on `http://localhost:5000` by default. CORS is preconfigured
for `http://localhost:5173` (Vite dev server). Add additional origins to
`CLIENT_ORIGIN` in `.env` if needed.

### Admin account + password security

The admin password is never stored in source code. `npm run seed` (and the
`.env` instructions below) set it securely:

| Variable         | Purpose                                                  |
|------------------|----------------------------------------------------------|
| `ADMIN_EMAIL`    | Admin email (default `admin@gmail.com`)                   |
| `ADMIN_NAME`     | Admin display name (default `Administrator`)              |
| `ADMIN_PASSWORD` | Password with at least 8 characters. If left empty a strong random password is generated and printed once. |

```bash
cp .env.example .env
npm run seed:admin     # create/refresh the admin (prints the generated password if ADMIN_PASSWORD unset)
```

Passwords are stored as **bcrypt hashes** only, so a database leak never
reveals them in plain text.

### Demo accounts created by the seeder

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | `ADMIN_EMAIL` or admin@gmail.com | from `ADMIN_PASSWORD` or auto-generated |
| Student | student@ptemaster.com  | student123  |

These exist only after `npm run seed` / `npm run seed:admin` and are not created
at runtime.

## API surface

All responses follow the same shape:

```json
{ "success": true, "message": "...", "data": {...} }
{ "success": false, "message": "..." }
```

### Health

| Method | Path           | Notes                |
|--------|----------------|----------------------|
| GET    | `/api/health`  | Liveness + uptime    |

### Auth (`/api/auth`)

| Method | Path                       | Auth   |
|--------|----------------------------|--------|
| POST   | `/register`                | public |
| POST   | `/login`                   | public |
| POST   | `/logout`                  | any    |
| GET    | `/me`                      | any    |
| PUT    | `/profile`                 | any    |
| POST   | `/change-password`         | any    |

### Questions (`/api/questions`)

| Method | Path                          | Auth   |
|--------|-------------------------------|--------|
| GET    | `/`                           | any (admin sees `correctAnswer`) |
| GET    | `/:id`                        | any (admin only on unpublished)  |
| GET    | `/skill/:skill`               | any                                |
| GET    | `/type/:type`                 | any                                |
| POST   | `/`                           | admin                              |
| PUT    | `/:id`                        | admin                              |
| DELETE | `/:id`                        | admin                              |
| PATCH  | `/:id/publish`                | admin                              |

Filterable via query string: `?skill=speaking&type=Multiple%20Choice&difficulty=Easy&page=1&limit=20&search=...`.
Students never see `correctAnswer` or `metadata.correctAnswers` on the wire.

### Results (`/api/results`)

| Method | Path             | Auth |
|--------|------------------|------|
| POST   | `/`              | any (compute objective score) |
| GET    | `/my-results`    | any  |
| GET    | `/progress`      | any  |
| GET    | `/:id`           | owner or admin |

### Mock tests (`/api/mock-tests`)

| Method | Path             | Auth   |
|--------|------------------|--------|
| GET    | `/`              | any    |
| GET    | `/:id`           | any    |
| POST   | `/:id/submit`    | any    |
| POST   | `/`              | admin  |
| PUT    | `/:id`           | admin  |
| DELETE | `/:id`           | admin  |

### Saved questions (`/api/saved-questions`)

| Method | Path                  | Auth |
|--------|-----------------------|------|
| POST   | `/:questionId`        | any  |
| GET    | `/`                   | any  |
| DELETE | `/id/:id`             | any  |
| DELETE | `/:questionId`        | any  |

### Admin (`/api/admin`)

All routes require an authenticated admin.

| Method | Path                       |
|--------|----------------------------|
| GET    | `/dashboard`              |
| GET    | `/statistics`              |
| GET    | `/students`               |
| GET    | `/students/:id`           |
| PATCH  | `/students/:id/status`    |
| DELETE | `/students/:id`           |
| GET    | `/results`                |

### Uploads (`/api/uploads`)

| Method | Path           | Auth  | Notes |
|--------|----------------|-------|-------|
| POST   | `/audio`       | admin | multipart `audio` field |
| POST   | `/image`       | admin | multipart `image` field |

Files land in `uploads/audio/<timestamp>-<random>-<name>` and are served at
`/uploads/audio/`. Allowed MIME types: `audio/webm`, `audio/mpeg`,
`audio/wav`, `audio/ogg`, `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
Default size cap: 15 MB (`MAX_UPLOAD_MB`).

## Security checklist

- Passwords hashed with bcryptjs (10 rounds).
- JWT signed with `JWT_SECRET`, delivered via `httpOnly` cookie **and**
  `Authorization: Bearer` header (so the frontend can use either).
- Role-based authorization enforced server-side — public registration can
  only create `student` accounts.
- Input validation on every endpoint; Mongoose schema enums block junk values.
- File uploads are mime-typed and size-limited; no executable extensions allowed.
- Errors return a uniform shape and never leak stack traces in production.
- CORS configured from `CLIENT_ORIGIN` env var; credentials are allowed.
- Correct answers are stripped from student-facing responses (`toStudentJSON`).

## Frontend integration

The recommended Axios setup is below — drop this into
`frontend/src/api/client.js`:

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // send httpOnly cookie
});

// Attach Bearer token if you also keep one in localStorage.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pte_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

## Scripts

| Command            | What it does                                          |
|--------------------|-------------------------------------------------------|
| `npm run dev`      | Start with nodemon                                     |
| `npm start`        | Start in production mode                               |
| `npm run seed`     | Insert demo data (skips if already present)            |
| `npm run seed -- --reset` | Drop demo data first, then re-insert           |
| `npm run seed:admin` | Create/refresh the admin user with a secure password |

## Scoring notes

The backend uses the same lightweight objective scoring the frontend runs
locally (`src/utils/scoring.js`). It supports:

- Multiple choice (single & multi-answer)
- Fill in the blanks
- Reorder paragraphs
- Highlight incorrect words
- Write from dictation
- Word-count heuristics for summarise / essay items

Speaking-only task types (`Read Aloud`, `Repeat Sentence`, etc.) record
attempt state but do not auto-grade — see the frontend's browser speech
recognition for richer feedback. All results are explicitly labelled as
"unofficial practice scoring".

## License & disclaimer

Practice content is for educational demonstration only. Not affiliated with
Pearson PTE Academic. Use at your own discretion for test preparation.
