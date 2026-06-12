import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const router = express.Router();

// Memory storage: no temp files left on disk, works on read-only
// filesystems (most deployment platforms)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const MAX_EXTRACTED_CHARS = 200000;

// POST /api/upload — accepts PDF, DOCX, or TXT and returns extracted text
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const fileExt = req.file.originalname.split(".").pop().toLowerCase();

  try {
    let extractedText = "";

    if (fileExt === "pdf") {
      const parser = new PDFParse({ data: req.file.buffer });
      try {
        const result = await parser.getText();
        extractedText = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (fileExt === "docx") {
      const docxData = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = docxData.value;
    } else if (fileExt === "txt" || fileExt === "md") {
      extractedText = req.file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({
        error: "Unsupported file format. Allowed: PDF, DOCX, TXT, MD.",
      });
    }

    extractedText = extractedText.trim();
    if (!extractedText) {
      return res.status(422).json({
        error: "No text could be extracted from this file. It may be a scanned/image-only document.",
      });
    }

    res.json({
      text: extractedText.slice(0, MAX_EXTRACTED_CHARS),
      filename: req.file.originalname,
      truncated: extractedText.length > MAX_EXTRACTED_CHARS,
    });
  } catch (error) {
    console.error("❌ File processing error:", error.message);
    res.status(500).json({ error: "Failed to process file. It may be corrupted or password-protected." });
  }
});

export default router;
