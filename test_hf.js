import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { queryModel } from './services/huggingFaceServices.js';

dotenv.config();

// 1. Setup Groq
// UPDATED MODEL: 'llama-3.3-70b-versatile' (The current active model)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 2. Setup Hugging Face (Summarisation)
const HF_SUMMARISE_URL = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn';

async function runHybridTests() {
  console.log("\n🚀 Starting Hybrid AI Test (Groq Llama 3.3 + BART)...\n");

  // --- TEST 1: REWRITE ---
  try {
    console.log("👉 Testing REWRITE (via Groq)...");
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Rewrite to be professional: The food was bad." }],
      // ✅ UPDATED MODEL ID
      model: "llama-3.3-70b-versatile",
    });
    console.log("✅ Result:", completion.choices[0]?.message?.content);
  } catch (err) {
    console.error("❌ Rewrite Failed:", err.message);
  }

  console.log("\n--------------------------------------------------\n");

  // --- TEST 2: GRAMMAR ---
  try {
    console.log("👉 Testing GRAMMAR (via Groq)...");
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Fix grammar: I goes home." }],
      // ✅ UPDATED MODEL ID
      model: "llama-3.3-70b-versatile",
    });
    console.log("✅ Result:", completion.choices[0]?.message?.content);
  } catch (err) {
    console.error("❌ Grammar Failed:", err.message);
  }

  console.log("\n--------------------------------------------------\n");

  // --- TEST 3: SUMMARISE ---
  try {
    console.log("👉 Testing SUMMARISE (via Hugging Face)...");
    const longText = "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France.";
    const result = await queryModel(HF_SUMMARISE_URL, longText);
    console.log("✅ Result:", result[0]?.summary_text || result);
  } catch (err) {
    console.error("❌ Summarise Failed:", err.message);
  }
  
  console.log("\nDONE.");
}

runHybridTests();