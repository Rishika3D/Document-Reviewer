import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nlpRoutes from "./routes/nlp.js";
// import uploadRoutes from "./routes/upload.js"; // Uncomment if you have this file

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// ✅ FIXED: Open CORS to prevent "Access Control" errors during dev
app.use(cors());

// ✅ REQUIRED: To parse JSON bodies from frontend
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Backend running ✅");
});

// Routes
app.use("/api/nlp", nlpRoutes);
// app.use("/api/upload", uploadRoutes);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`👉 API endpoint ready at http://localhost:${PORT}/api/nlp/rewrite\n`);
});