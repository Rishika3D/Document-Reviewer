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

```bash
npm install
cp .env.example .env   # then paste your GROQ_API_KEY
npm run dev            # or: npm start
```

Server runs at http://localhost:5050.

## Deploy (Render / Railway / Fly / Heroku)

1. Push this repo to GitHub (node_modules and .env are gitignored).
2. Create a new **Web Service** from the repo.
   - Build command: `npm install`
   - Start command: `npm start`
3. Set environment variables:
   - `GROQ_API_KEY` (required)
   - `JWT_SECRET` (required) — generate with `openssl rand -hex 32`
   - `ALLOWED_ORIGINS` — your frontend URL(s), comma-separated (recommended; CORS is open to all origins if unset)
   - `DB_PATH` — optional; point at a persistent disk so user accounts survive redeploys (SQLite defaults to `./data/app.db`, which is ephemeral on most free tiers)
4. The platform sets `PORT` automatically; the server binds `0.0.0.0` and handles SIGTERM gracefully.
5. Point the frontend at the deployed URL by setting `VITE_API_URL` in the React app's env.

## Frontend

The React app lives in `react/`:

```bash
cd react
npm install
echo "VITE_API_URL=http://localhost:5050" > .env   # or your deployed backend URL
npm run dev
```
