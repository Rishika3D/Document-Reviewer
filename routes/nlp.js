import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { queryModel } from '../services/huggingFaceServices.js';

dotenv.config();

const router = express.Router();

// --- 1. SETUP GOOGLE GEMINI (For Rewrite & Grammar) ---
// We use Gemini because the free Hugging Face models are currently unstable.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using 'gemini-1.5-flash' as the standard efficient model.
// If you are in Nov 2025 and this gives a 404, switch to 'gemini-2.0-flash'
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- 2. SETUP HUGGING FACE (For Summarisation Only) ---
// BART is working perfectly, so we keep using it.
// Note: We updated the URL to the new 'router' domain for better stability.
const MODELS = {
  SUMMARISE: 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn',
};

// ✅ REWRITE ROUTE (Uses Google Gemini)
router.post('/rewrite', async (req, res) => {
  const { text } = req.body;
  console.log(`📝 Rewrite Request. Text length: ${text?.length}`);

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  try {
    // Construct a clear prompt for Gemini
    const prompt = `Rewrite the following text to be more professional, polite, and clear. Return ONLY the rewritten text, no explanations.\n\nText: "${text}"`;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const rewrittenText = response.text().trim();

    res.json({ rewritten: rewrittenText });
  } catch (err) {
    console.error('❌ Rewrite Route Error:', err.message);
    // Fallback error message
    res.status(500).json({ 
      error: 'Rewriting failed.', 
      details: err.message.includes('429') ? 'AI is currently busy (Rate Limit). Please try again.' : err.message 
    });
  }
});

// ✅ GRAMMAR ROUTE (Uses Google Gemini)
router.post('/grammar', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text is required.' });

  try {
    const prompt = `Fix the grammar and spelling in the following text. Return ONLY the corrected text. If the text is already correct, return it as is.\n\nText: "${text}"`;
    
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const correctedText = response.text().trim();

    res.json({ correctedText: correctedText });
  } catch (err) {
    console.error('❌ Grammar Route Error:', err.message);
    res.status(500).json({ 
      error: 'Grammar correction failed.', 
      details: err.message 
    });
  }
});

// ✅ SUMMARISE ROUTE (Uses Hugging Face BART)
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
    console.error('❌ Summary Route Error:', err.message);
    res.status(500).json({ error: 'Summarisation failed.', details: err.message });
  }
});

export default router;