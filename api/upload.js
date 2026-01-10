import { verifyToken } from './_lib/auth.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      return reject(new Error('No boundary found'));
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const parts = buffer.toString('binary').split(`--${boundary}`);
      
      const fields = {};
      const files = {};
      
      for (const part of parts) {
        if (part.includes('Content-Disposition')) {
          const nameMatch = part.match(/name="([^"]+)"/);
          const filenameMatch = part.match(/filename="([^"]+)"/);
          
          if (nameMatch) {
            const name = nameMatch[1];
            const contentStart = part.indexOf('\r\n\r\n') + 4;
            const contentEnd = part.lastIndexOf('\r\n');
            const content = part.substring(contentStart, contentEnd);
            
            if (filenameMatch) {
              const filename = filenameMatch[1];
              const mimeMatch = part.match(/Content-Type: ([^\r\n]+)/);
              const mimetype = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
              
              files[name] = {
                originalname: filename,
                mimetype,
                buffer: Buffer.from(content, 'binary'),
                size: Buffer.from(content, 'binary').length
              };
            } else {
              fields[name] = content;
            }
          }
        }
      }
      
      resolve({ fields, files });
    });
    req.on('error', reject);
  });
}

function getExt(filename = "") {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

async function extractText(file) {
  const ext = getExt(file.originalname);

  if (ext === ".txt") {
    return file.buffer.toString("utf-8");
  }

  if (ext === ".pdf") {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(file.buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const mammoth = await import('mammoth');
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const { fields, files } = await parseMultipartForm(req);
    const { conversationId, kind } = fields;
    const file = files.file;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId required" });
    }

    if (!file) {
      return res.status(400).json({ error: "file required" });
    }

    const ext = getExt(file.originalname);
    const mime = file.mimetype;

    const ALLOWED_EXT = new Set([".pdf", ".docx", ".txt"]);
    const ALLOWED_MIME = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]);

    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(mime)) {
      return res.status(400).json({
        error: "unsupported_file_type",
        message: "Nur PDF, DOCX oder TXT sind erlaubt.",
        received: { ext, mime },
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: "file_too_large",
        message: "Datei ist zu groß (max. 5MB).",
      });
    }

    const extracted = (await extractText(file)).trim();
    if (!extracted) {
      return res.status(400).json({
        error: "empty_text",
        message: "Konnte keinen Text aus der Datei extrahieren.",
      });
    }

    const prompt = buildAnalysisPrompt(kind, extracted);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Du gibst professionelles, konstruktives Feedback zu Bewerbungsunterlagen. Bleib konkret und praxisnah.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content ?? "";

    return res.json({
      ok: true,
      analysisText,
      meta: {
        filename: file.originalname,
        mime,
        size: file.size,
        kind: kind || "cv",
      },
    });
  } catch (err) {
    console.error("Upload/analyze error:", err);
    res.status(500).json({ error: "upload_failed" });
  }
}
