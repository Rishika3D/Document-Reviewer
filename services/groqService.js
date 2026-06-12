import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PRIMARY_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Run a chat completion against Groq with a timeout and automatic
 * fallback to a smaller model if the primary one fails (rate limit,
 * decommission, etc.).
 */
export async function chat(systemPrompt, userText, { temperature = 0.4 } = {}) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userText },
  ];

  const run = (model) =>
    groq.chat.completions.create(
      { messages, model, temperature },
      { timeout: REQUEST_TIMEOUT_MS }
    );

  let completion;
  try {
    completion = await run(PRIMARY_MODEL);
  } catch (err) {
    console.warn(`⚠️ ${PRIMARY_MODEL} failed (${err.message}). Retrying with ${FALLBACK_MODEL}...`);
    completion = await run(FALLBACK_MODEL);
  }

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Model returned an empty response.");
  }
  return content;
}
