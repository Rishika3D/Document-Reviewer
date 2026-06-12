import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nlpRoutes from "./routes/nlp.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in .env — the NLP features will not work without it.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5050;

// Needed so express-rate-limit sees the real client IP behind
// deployment proxies (Render, Railway, Heroku, etc.)
app.set("trust proxy", 1);

// CORS: open in dev, restricted to ALLOWED_ORIGINS (comma-separated) in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : null;

app.use(
  cors({
    origin: allowedOrigins || true,
  })
);

app.use(express.json({ limit: "2mb" }));

// Health check (used by deployment platforms)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", service: "document-reviewer-backend" });
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Routes
app.use("/api/nlp", nlpRoutes);
app.use("/api/upload", uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Central error handler (catches malformed JSON, multer errors, etc.)
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large. Max 2MB of text." });
  }
  if (err.name === "MulterError") {
    const msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum size is 10MB."
        : `Upload error: ${err.message}`;
    return res.status(400).json({ error: msg });
  }
  if (err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`👉 NLP API:    /api/nlp/{rewrite,grammar,summarise,keypoints}`);
  console.log(`👉 Upload API: /api/upload\n`);
});

// Graceful shutdown for deployment platforms
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
