import express from "express";
import rateLimit from "express-rate-limit";
import { createHelpRequest } from "../services/db.js";

const router = express.Router();

const helpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many messages. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/help — public contact form
router.post("/", helpLimiter, (req, res) => {
  const { email, subject, message } = req.body || {};

  if (!EMAIL_RE.test(email || "")) return res.status(400).json({ error: "A valid email is required." });
  if (!subject?.trim()) return res.status(400).json({ error: "Subject is required." });
  if (!message?.trim()) return res.status(400).json({ error: "Message is required." });
  if (subject.length > 300 || message.length > 5000) {
    return res.status(400).json({ error: "Message too long." });
  }

  createHelpRequest({
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });
  res.status(201).json({ ok: true });
});

export default router;
