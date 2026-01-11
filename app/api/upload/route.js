import { NextResponse } from "next/server";
import OpenAI from "openai";
import mammoth from "mammoth";
import PDFParser from "pdf2json";
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
  const pdfParser = new PDFParser();
  
  return new Promise((resolve, reject) => {
    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error(errData.parserError));
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let extractedText = '';
        
        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          pdfData.Pages.forEach((page) => {
            if (page.Texts && Array.isArray(page.Texts)) {
              const pageText = page.Texts
                .map(text => {
                  if (text.R && Array.isArray(text.R)) {
                    return text.R.map(r => decodeURIComponent(r.T || '')).join(' ');
                  }
                  return '';
                })
                .filter(Boolean)
                .join(' ');
              
              extractedText += pageText + '\n';
            }
          });
        }
        
        resolve(extractedText.trim());
      } catch (extractError) {
        reject(extractError);
      }
    });
    
    pdfParser.parseBuffer(buffer);
  });
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
    console.log('[Upload API] Request received');
    
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.log('[Upload API] Unauthorized - no user ID');
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    console.log('[Upload API] User authenticated:', userId);

    // Check content-type header
    const contentType = request.headers.get('content-type') || '';
    console.log('[Upload API] Content-Type:', contentType);

    if (!contentType.includes('multipart/form-data')) {
      console.error('[Upload API] Invalid Content-Type:', contentType);
      return NextResponse.json(
        { 
          error: "Invalid request format",
          message: "Request must be multipart/form-data. Ensure you're sending a FormData object without manually setting Content-Type header."
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    console.log('[Upload API] FormData parsed successfully');
    const conversationId = formData.get('conversationId');
    const kind = formData.get('kind');
    const file = formData.get('file');

    console.log('[Upload API] FormData fields:', {
      hasConversationId: !!conversationId,
      hasKind: !!kind,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size
    });

    if (!conversationId) {
      console.log('[Upload API] Missing conversationId');
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 }
      );
    }

    if (!file) {
      console.log('[Upload API] Missing file');
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

    console.log('[Upload API] Converting file to buffer...');
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    console.log('[Upload API] Buffer created, size:', buffer.length);

    console.log('[Upload API] Extracting text from file...');
    const extracted = (await extractText(file, buffer)).trim();
    console.log('[Upload API] Text extracted, length:', extracted.length);
    
    if (!extracted) {
      console.log('[Upload API] No text extracted from file');
      return NextResponse.json({
        error: "empty_text",
        message: "Konnte keinen Text aus der Datei extrahieren.",
      }, { status: 400 });
    }

    console.log('[Upload API] Sending to OpenAI for analysis...');
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
    console.log('[Upload API] Analysis complete, length:', analysisText.length);

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
    console.error('[Upload API] Error:', err);
    console.error('[Upload API] Error stack:', err.stack);
    
    // Check if it's a FormData parsing error
    if (err.message && err.message.includes('Content-Type')) {
      return NextResponse.json(
        { 
          error: "Invalid request format",
          message: "Request must be multipart/form-data. Do not manually set Content-Type header when sending FormData."
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "upload_failed",
        message: err.message || "File upload and analysis failed"
      },
      { status: 500 }
    );
  }
}
