import { NextResponse } from "next/server";
import OpenAI from "openai";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { getCurrentUser } from "@/lib/auth";

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

async function extractText(file, buffer) {
  const ext = getExt(file.name);

  if (ext === ".txt") {
    return buffer.toString("utf-8");
  }

  if (ext === ".pdf") {
    return await extractPdfText(buffer);
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
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

export async function POST(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const conversationId = formData.get('conversationId');
    const kind = formData.get('kind');
    const file = formData.get('file');

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "file required" },
        { status: 400 }
      );
    }

    const ext = getExt(file.name);
    const mime = file.type;

    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(mime)) {
      return NextResponse.json({
        error: "unsupported_file_type",
        message: "Nur PDF, DOCX oder TXT sind erlaubt.",
        received: { ext, mime },
      }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const extracted = (await extractText(file, buffer)).trim();
    if (!extracted) {
      return NextResponse.json({
        error: "empty_text",
        message: "Konnte keinen Text aus der Datei extrahieren.",
      }, { status: 400 });
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

    return NextResponse.json({
      ok: true,
      analysisText,
      meta: {
        filename: file.name,
        mime,
        size: file.size,
        kind: kind || "cv",
      },
    });
  } catch (err) {
    console.error("Upload/analyze error:", err);
    return NextResponse.json(
      { error: "upload_failed" },
      { status: 500 }
    );
  }
}
