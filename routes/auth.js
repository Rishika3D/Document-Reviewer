import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { createUser, findUserByEmail, findUserById } from "../services/db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Tight limiter on auth endpoints to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

// POST /api/auth/signup
router.post("/signup", authLimiter, async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name?.trim()) return res.status(400).json({ error: "Name is required." });
  if (!EMAIL_RE.test(email || "")) return res.status(400).json({ error: "A valid email is required." });
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
  }

  if (findUserByEmail(email.trim())) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });
    const user = { id: result.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase() };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    res.status(500).json({ error: "Could not create the account. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body || {};

  if (!email?.trim() || typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = findUserByEmail(email.trim());
  // Same error for unknown email and wrong password — don't leak which it was
  const invalid = () => res.status(401).json({ error: "Incorrect email or password." });

  if (!user) return invalid();

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return invalid();

  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me — validate the stored token and fetch fresh user info
router.get("/me", requireAuth, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(401).json({ error: "Account no longer exists." });
  res.json({ user: publicUser(user) });
});

export default router;
