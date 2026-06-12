import express from "express";
import {
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from "../services/db.js";

// Mounted behind requireAuth — req.user is always set.
const router = express.Router();

const MAX_TITLE = 300;
const MAX_CONTENT = 2_000_000; // ~2MB of HTML, matches the JSON body limit

// Strip HTML tags so list snippets are plain text
const toSnippet = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);

const publicDoc = (d) => ({
  id: d.id,
  title: d.title,
  starred: !!d.starred,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
  ...(d.snippet !== undefined ? { snippet: toSnippet(d.snippet) } : {}),
  ...(d.content !== undefined ? { content: d.content } : {}),
});

// GET /api/documents?search=&starred=1
router.get("/", (req, res) => {
  const docs = listDocuments(req.user.id, {
    search: (req.query.search || "").slice(0, 200),
    starred: req.query.starred === "1" || req.query.starred === "true",
  });
  res.json({ documents: docs.map(publicDoc) });
});

// POST /api/documents
router.post("/", (req, res) => {
  const { title, content } = req.body || {};
  if (title && title.length > MAX_TITLE) return res.status(400).json({ error: "Title too long." });
  if (content && content.length > MAX_CONTENT) return res.status(400).json({ error: "Document too large." });

  const result = createDocument(req.user.id, { title, content });
  const doc = getDocument(req.user.id, result.lastInsertRowid);
  res.status(201).json({ document: publicDoc(doc) });
});

// GET /api/documents/:id
router.get("/:id", (req, res) => {
  const doc = getDocument(req.user.id, req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  res.json({ document: publicDoc(doc) });
});

// PUT /api/documents/:id — partial update: title, content, starred
router.put("/:id", (req, res) => {
  const { title, content, starred } = req.body || {};
  if (title !== undefined && (typeof title !== "string" || title.length > MAX_TITLE)) {
    return res.status(400).json({ error: "Invalid title." });
  }
  if (content !== undefined && (typeof content !== "string" || content.length > MAX_CONTENT)) {
    return res.status(400).json({ error: "Invalid or too large content." });
  }

  const result = updateDocument(req.user.id, req.params.id, { title, content, starred });
  if (!result.changes) return res.status(404).json({ error: "Document not found." });
  const doc = getDocument(req.user.id, req.params.id);
  res.json({ document: publicDoc(doc) });
});

// DELETE /api/documents/:id
router.delete("/:id", (req, res) => {
  const result = deleteDocument(req.user.id, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Document not found." });
  res.json({ ok: true });
});

export default router;
