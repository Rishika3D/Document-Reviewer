import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

// SQLite file lives next to the backend code in data/app.db.
// Note: on platforms with ephemeral filesystems (Render free tier, etc.)
// this resets on redeploy — attach a persistent disk or point DB_PATH
// at one to keep accounts across deploys.
const baseDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(baseDir, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(process.env.DB_PATH || path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled document',
    content TEXT NOT NULL DEFAULT '',
    starred INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const createUser = ({ name, email, passwordHash }) =>
  db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, passwordHash);

export const findUserByEmail = (email) =>
  db.prepare("SELECT * FROM users WHERE email = ?").get(email);

export const findUserById = (id) =>
  db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(id);

// --- documents ---

export const createDocument = (userId, { title, content }) =>
  db
    .prepare("INSERT INTO documents (user_id, title, content) VALUES (?, ?, ?)")
    .run(userId, title || "Untitled document", content || "");

export const listDocuments = (userId, { search, starred } = {}) => {
  let sql = `SELECT id, title, starred, created_at, updated_at,
               substr(content, 1, 300) AS snippet
             FROM documents WHERE user_id = ?`;
  const params = [userId];
  if (starred) sql += " AND starred = 1";
  if (search) {
    sql += " AND (title LIKE ? OR content LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY updated_at DESC";
  return db.prepare(sql).all(...params);
};

export const getDocument = (userId, id) =>
  db.prepare("SELECT * FROM documents WHERE id = ? AND user_id = ?").get(id, userId);

export const updateDocument = (userId, id, { title, content, starred }) => {
  const sets = [];
  const params = [];
  if (title !== undefined) { sets.push("title = ?"); params.push(title); }
  if (content !== undefined) { sets.push("content = ?"); params.push(content); }
  if (starred !== undefined) { sets.push("starred = ?"); params.push(starred ? 1 : 0); }
  if (!sets.length) return { changes: 0 };
  // Only bump updated_at for real edits, not star toggles
  if (title !== undefined || content !== undefined) sets.push("updated_at = datetime('now')");
  params.push(id, userId);
  return db
    .prepare(`UPDATE documents SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`)
    .run(...params);
};

export const deleteDocument = (userId, id) =>
  db.prepare("DELETE FROM documents WHERE id = ? AND user_id = ?").run(id, userId);

// --- help requests ---

export const createHelpRequest = ({ email, subject, message }) =>
  db
    .prepare("INSERT INTO help_requests (email, subject, message) VALUES (?, ?, ?)")
    .run(email, subject, message);

export default db;
