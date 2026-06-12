import express from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../services/groqService.js";

const router = express.Router();

// --- RATE LIMITING ---
// Prevents abuse of the free-tier AI credits: 30 requests / 15 min per IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(apiLimiter);

// --- INPUT VALIDATION ---
const MAX_TEXT_LENGTH = 50000; // ~10k words, safely within model context

function validateText(req, res, next) {
  const { text } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text is required." });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: `Text too long (${text.length} chars). Maximum is ${MAX_TEXT_LENGTH} characters.`,
    });
  }
  req.body.text = text.trim();
  next();
}

function handleError(res, label, err) {
  console.error(`❌ ${label} Error:`, err.message);
  const status = err.status === 429 ? 429 : 502;
  const message =
    status === 429
      ? "The AI service is rate-limited right now. Please try again in a minute."
      : `${label} failed. Please try again.`;
  res.status(status).json({ error: message });
}

// --- ROUTES ---

// REWRITE: optional `tone` ("professional", "friendly", "concise"...) and
// `target` audience ("manager", "client"...)
router.post("/rewrite", validateText, async (req, res) => {
  const { text, tone = "professional", target } = req.body;
  try {
    const audience = target ? ` The text is addressed to a ${target}.` : "";
    const rewritten = await chat(
      `You are a professional editor. Rewrite the user's text to be ${tone}, polite, and clear, preserving its meaning and approximate length.${audience} Output ONLY the rewritten text with no preamble or explanations.`,
      text
    );
    res.json({ rewritten });
  } catch (err) {
    handleError(res, "Rewrite", err);
  }
});

// GRAMMAR: fixes grammar/spelling/punctuation only
router.post("/grammar", validateText, async (req, res) => {
  try {
    const correctedText = await chat(
      "You are a grammar checker. Fix grammar, spelling, and punctuation in the user's text. Change nothing else — keep the original wording, tone, and formatting wherever it is already correct. Output ONLY the corrected text, no explanations.",
      req.body.text,
      { temperature: 0.2 }
    );
    res.json({ correctedText });
  } catch (err) {
    handleError(res, "Grammar correction", err);
  }
});

// SUMMARISE: optional `length` (target word count) and `format`
// ("paragraph" | "bullets"). Mounted at both spellings.
const summariseHandler = async (req, res) => {
  const { text, length, format = "paragraph" } = req.body;
  try {
    const words = Number(length) > 0 ? Math.min(Number(length), 1000) : null;
    const lengthInstruction = words
      ? `The summary must be approximately ${words} words.`
      : "Keep the summary to roughly 20% of the original length.";
    const formatInstruction =
      format === "bullets"
        ? "Format the summary as concise bullet points."
        : "Write the summary as flowing prose.";

    const summary = await chat(
      `You are an expert summarizer. Summarize the user's text, capturing the key ideas accurately. ${lengthInstruction} ${formatInstruction} Output ONLY the summary, no preamble.`,
      text,
      { temperature: 0.3 }
    );
    res.json({ summary });
  } catch (err) {
    handleError(res, "Summarisation", err);
  }
};
router.post("/summarise", validateText, summariseHandler);
router.post("/summarize", validateText, summariseHandler);

// KEY POINTS: extracts the main takeaways as a list
router.post("/keypoints", validateText, async (req, res) => {
  try {
    const result = await chat(
      'You are a document analyst. Extract the key points from the user\'s text. Respond with ONLY a JSON object of the shape {"keypoints": ["point 1", "point 2", ...]} containing 3-8 concise points. No markdown fences, no other text.',
      req.body.text,
      { temperature: 0.2 }
    );
    let keypoints;
    try {
      keypoints = JSON.parse(result.replace(/^```(json)?|```$/g, "").trim()).keypoints;
    } catch {
      // Model didn't return clean JSON — fall back to splitting lines
      keypoints = result
        .split("\n")
        .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter(Boolean);
    }
    res.json({ keypoints });
  } catch (err) {
    handleError(res, "Key point extraction", err);
  }
});

// TITLE: suggests a title for a document (Notion-style)
router.post("/title", validateText, async (req, res) => {
  try {
    const title = await chat(
      "Generate a short, clear title (under 10 words) for the user's document. Output ONLY the title — no quotes, no explanations.",
      req.body.text,
      { temperature: 0.5 }
    );
    res.json({ title: title.replace(/^["']|["']$/g, "") });
  } catch (err) {
    handleError(res, "Title generation", err);
  }
});

export default router;
