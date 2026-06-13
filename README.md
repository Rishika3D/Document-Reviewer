# Document Reviewer — Backend

Express API powering the Document Reviewer app (Notion-style editor with AI features).
AI inference runs on [Groq](https://console.groq.com) (Llama 3.3 70B, with automatic fallback to Llama 3.1 8B).

## Features / Endpoints

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/health` | — | `{ status, uptime }` |
| POST | `/api/auth/signup` | `{ name, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — (Bearer token) | `{ user }` |
| POST | `/api/nlp/rewrite` | `{ text, tone?, target? }` | `{ rewritten }` |
| POST | `/api/nlp/grammar` | `{ text }` | `{ correctedText }` |
| POST | `/api/nlp/summarise` (or `/summarize`) | `{ text, length?, format? }` | `{ summary }` |
| POST | `/api/nlp/keypoints` | `{ text }` | `{ keypoints: [...] }` |
| POST | `/api/nlp/title` | `{ text }` | `{ title }` |
| POST | `/api/upload` | multipart `file` (PDF/DOCX/TXT/MD, max 10MB) | `{ text, filename, truncated }` |
| GET | `/api/documents?search=&starred=1` | — | `{ documents: [...] }` |
| POST | `/api/documents` | `{ title?, content? }` | `{ document }` |
| GET/PUT/DELETE | `/api/documents/:id` | PUT: `{ title?, content?, starred? }` | `{ document }` / `{ ok }` |
| POST | `/api/help` | `{ email, subject, message }` | `{ ok }` |

- `length` — target summary word count (max 1000)
- `format` — `"paragraph"` (default) or `"bullets"`
- `tone` — e.g. `"professional"` (default), `"friendly"`, `"concise"`
- All `/api/nlp/*`, `/api/upload`, and `/api/documents` routes require a `Authorization: Bearer <token>` header; documents are scoped per user.
- Auth: bcrypt-hashed passwords in SQLite, JWT sessions (7-day expiry).
- Rate limits: 30 AI requests / 15 min per user; 15 auth attempts / 15 min per IP.
- All text inputs capped at 50,000 characters; security headers via helmet.
- Errors always return JSON: `{ "error": "..." }`

## Run locally

Two terminals during development (Vite proxies `/api` to the backend):

```bash
# 1. Backend
npm install
cp .env.example .env          # paste GROQ_API_KEY; JWT_SECRET is auto-generated if you add one
npm run dev                   # http://localhost:5050

# 2. Frontend (hot reload)
cd react && npm install && npm run dev   # http://localhost:5173
```

To run the production bundle locally (single service — backend serves the built SPA):

```bash
npm run build   # installs + builds react/dist
npm start       # http://localhost:5050 serves both API and app
```

## Deploy (single service — Render / Railway / Fly / Heroku)

The backend serves the built React app, so you deploy **one** web service — no
separate frontend host, no CORS or `VITE_API_URL` to configure.

1. Push this repo to GitHub (`node_modules`, `.env`, and `data/` are gitignored).
2. Create a **Web Service** from the repo:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
3. Set environment variables:
   - `GROQ_API_KEY` (required)
   - `JWT_SECRET` (required) — generate with `openssl rand -hex 32`
   - `DB_PATH` — optional; point at a persistent disk so accounts/documents
     survive redeploys (SQLite defaults to `./data/app.db`, ephemeral on most free tiers)
   - `ALLOWED_ORIGINS` — only needed if you host the frontend on a *different*
     origin; same-origin (the default single-service setup) needs nothing.
4. The platform sets `PORT` automatically; the server binds `0.0.0.0`, gzips
   responses, sets security headers, and handles SIGTERM gracefully.

The SPA falls back to `index.html` for client-side routes, so deep links like
`/edit/42` work on refresh.
