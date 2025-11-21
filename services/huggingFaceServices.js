import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const HF_TOKEN = process.env.HF_TOKEN

// Fail fast if the token is missing
if (!HF_TOKEN) {
  console.error("❌ Missing HF_TOKEN in .env file")
  process.exit(1)
}

export async function queryModel(modelUrl, input, params = {}) {
  try {
    const response = await axios.post(
      modelUrl,
      {
        inputs: input,
        parameters: params
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  } catch (err) {
    // Log detailed error from HF if available
    console.error("🔥 HF Error:", err.response?.data || err.message)
    
    // Check for common "Model Loading" 503 error
    if (err.response?.status === 503) {
       throw new Error("Model is loading (cold start). Please try again in 20 seconds.");
    }

    throw new Error(err.response?.data?.error || "Inference failed")
  }
}