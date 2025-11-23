import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk'; // Using Groq because it passed your connectivity tests
import rateLimit from 'express-rate-limit'; // Security package
import { queryModel } from '../services/huggingFaceServices.js';

dotenv.config();

const router = express.Router();

// --- 1. SECURITY: RATE LIMITING ---
// This prevents users from spamming your API and using up your free credits.
// Settings: 20 requests per 15 minutes per IP address.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiter to all routes in this router
router.use(apiLimiter);


// --- 2. SETUP AI SERVICES ---

// A. GROQ (For Rewrite & Grammar)
// We use Groq/Llama-3.3 because it is currently the most stable free option.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// B. HUGGING FACE (For Summarisation Only)
// BART works well for summaries and is stable on HF.
const MODELS = {
  SUMMARISE: 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn',
};


// --- 3. ROUTES ---

// ✅ REWRITE ROUTE (Using Groq)
router.post('/rewrite', async (req, res) => {
  const { text } = req.body;
  console.log(`📝 Rewrite Request. Length: ${text?.length}`);

  if (!text?.trim()) return res.status(400).json({ error: 'Text is required.' });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional editor. Rewrite the user's text to be professional, polite, and clear. Output ONLY the rewritten text. Do not add conversational filler like 'Here is the rewritten text'."
        },
        {
          role: "user",
          content: text
        }
      ],
      // Verified working model ID from your tests
      model: "llama-3.3-70b-versatile",
    });

    const rewrittenText = completion.choices[0]?.message?.content || "";
    res.json({ rewritten: rewrittenText });

  } catch (err) {
    console.error('❌ Rewrite Error:', err.message);
    res.status(500).json({ error: 'Rewriting failed.', details: err.message });
  }
});

// ✅ GRAMMAR ROUTE (Using Groq)
router.post('/grammar', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text is required.' });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a grammar checker. Fix the grammar and spelling in the user's text. Output ONLY the corrected text. Do not provide explanations or notes."
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const correctedText = completion.choices[0]?.message?.content || "";
    res.json({ correctedText: correctedText });

  } catch (err) {
    console.error('❌ Grammar Error:', err.message);
    res.status(500).json({ error: 'Grammar correction failed.', details: err.message });
  }
});

// ✅ SUMMARISE ROUTE (Using Hugging Face BART)
router.post('/summarise', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text is required.' });

  try {
    // BART is a summarization-specific model, so we send the text directly
    const response = await queryModel(MODELS.SUMMARISE, text);
    
    // Handle standard Hugging Face response format
    const summary = response[0]?.summary_text || response?.summary_text || 'No summary generated.';
    
    res.json({ summary: summary });
  } catch (err) {
    console.error('❌ Summary Error:', err.message);
    res.status(500).json({ error: 'Summarisation failed.', details: err.message });
  }
});

export default router;