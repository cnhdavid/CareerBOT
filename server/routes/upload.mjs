import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import { authenticateToken } from "./auth.mjs";
import OpenAI from "openai";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const router = express.Router();

// Require auth (consistent with conversations)
router.use(authenticateToken);

// memory storage for MVP (no filesystem needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Allowed formats
const ALLOWED_EXT = new Set([".pdf", ".docx", ".txt"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function getExt(filename = "") {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

async function extractPdfText(buffer) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const strings = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean);

    fullText += strings.join(" ") + "\n";
  }

  return fullText;
}

async function extractText(file) {
  const ext = getExt(file.originalname);

  if (ext === ".txt") {
    return file.buffer.toString("utf-8");
  }

  if (ext === ".pdf") {
  return await extractPdfText(file.buffer);
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }

  return "";
}

function buildAnalysisPrompt(kind, text) {
  const docType = kind === "cover_letter" ? "Anschreiben" : "Lebenslauf";
  return `
Du bist ein Career-Coach. Analysiere den folgenden Text eines ${docType}.
Gib ein kurzes, strukturiertes Feedback auf Deutsch.

FORMAT (genau so ausgeben):
1) Kurzfazit (2-3 Sätze)
2) Stärken (3 Bullet Points)
3) Verbesserungen (5 Bullet Points)
4) Konkrete nächste Schritte (3 Bullet Points)

Text:
"""
${text.slice(0, 12000)}
"""
`.trim();
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { conversationId, kind } = req.body ?? {};
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "file required" });
    }

    const ext = getExt(req.file.originalname);
    const mime = req.file.mimetype;

    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(mime)) {
      return res.status(400).json({
        error: "unsupported_file_type",
        message: "Nur PDF, DOCX oder TXT sind erlaubt.",
        received: { ext, mime },
      });
    }

    const extracted = (await extractText(req.file)).trim();
    if (!extracted) {
      return res.status(400).json({
        error: "empty_text",
        message: "Konnte keinen Text aus der Datei extrahieren.",
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildAnalysisPrompt(kind, extracted);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Du gibst professionelles, konstruktives Feedback zu Bewerbungsunterlagen. Bleib konkret und praxisnah.",
        },
        { role: "user", content: prompt },
      ],
    });

    const analysisText = completion.choices[0]?.message?.content ?? "";

    return res.json({
      ok: true,
      analysisText,
      meta: {
        filename: req.file.originalname,
        mime,
        size: req.file.size,
        kind: kind || "cv",
      },
    });
  } catch (err) {
    console.error("Upload/analyze error:", err);
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "file_too_large",
        message: "Datei ist zu groß (max. 5MB).",
      });
    }
    res.status(500).json({ error: "upload_failed" });
  }
});

export default router;
