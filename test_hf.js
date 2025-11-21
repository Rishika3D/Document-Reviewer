import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { queryModel } from './services/huggingFaceServices.js';

dotenv.config();

// 1. Setup Google Gemini
// We use 'gemini-2.0-flash' which has a generous free quota and is very stable.
// (Gemini 2.5 is hitting 429 limits, so we stick to 2.0)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 2. Setup Hugging Face (Summarisation)
const HF_SUMMARISE_URL = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn';

async function runHybridTests() {
  console.log("\n🚀 Starting Hybrid AI Test (Gemini 2.0 Flash + BART)...\n");

  // --- TEST 1: REWRITE ---
  try {
    console.log("👉 Testing REWRITE (via Gemini 2.0)...");
    const prompt = "Rewrite this sentence to be professional: 'The food was extremely bad and I hated it.'";
    const result = await geminiModel.generateContent(prompt);
    console.log("✅ Result:", result.response.text().trim());
  } catch (err) {
    console.error("❌ Rewrite Failed:", err.message);
  }

  console.log("\n--------------------------------------------------\n");

  // --- TEST 2: GRAMMAR ---
  try {
    console.log("👉 Testing GRAMMAR (via Gemini 2.0)...");
    const prompt = "Fix the grammar: 'I goes to the store yesterday.' Return only the fixed sentence.";
    const result = await geminiModel.generateContent(prompt);
    console.log("✅ Result:", result.response.text().trim());
  } catch (err) {
    console.error("❌ Grammar Failed:", err.message);
  }

  console.log("\n--------------------------------------------------\n");

  // --- TEST 3: SUMMARISE ---
  try {
    console.log("👉 Testing SUMMARISE (via Hugging Face)...");
    const longText = "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world.";
    
    const result = await queryModel(HF_SUMMARISE_URL, longText);
    console.log("✅ Result:", result[0]?.summary_text || result);
  } catch (err) {
    console.error("❌ Summarise Failed:", err.message);
  }
  
  console.log("\nDONE.");
}

runHybridTests();