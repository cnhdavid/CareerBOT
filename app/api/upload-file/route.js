import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import File from "@/lib/models/File";
import Conversation from "@/lib/models/Conversation";
import { getCurrentUser } from "@/lib/auth";
import mammoth from "mammoth";
import PDFParser from "pdf2json";

const ALLOWED_EXT = new Set([".pdf", ".docx", ".txt"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

export async function POST(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check content-type header
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { 
          error: "Invalid request format",
          message: "Request must be multipart/form-data"
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const conversationId = formData.get('conversationId');
    const messageText = formData.get('messageText');
    const file = formData.get('file');

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const ext = getExt(file.name);
    const mime = file.type;

    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(mime)) {
      return NextResponse.json({
        error: "unsupported_file_type",
        message: "Only PDF, DOCX, and TXT files are allowed",
        received: { ext, mime },
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: "file_too_large",
        message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        received: { size: file.size, maxSize: MAX_FILE_SIZE },
      }, { status: 400 });
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Extract text from file
    const extractedText = await extractText(file, buffer);

    await connectDB();

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId 
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Save file to database with extracted text
    const fileDoc = new File({
      userId,
      conversationId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      data: buffer,
      extractedText: extractedText,
      uploadTimestamp: new Date(),
    });

    await fileDoc.save();

    // Add messages to conversation
    if (messageText && messageText.trim()) {
      // Add user text message
      conversation.messages.push({
        role: "user",
        content: messageText.trim(),
        timestamp: new Date(),
      });
    }
    
    // Add file upload message with document reference
    conversation.messages.push({
      role: "user",
      content: `📎 Document uploaded: ${file.name}`,
      timestamp: new Date(),
      documentId: fileDoc._id,
      filename: file.name,
    });
    
    conversation.updatedAt = new Date();
    await conversation.save();

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: fileDoc._id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        uploadTimestamp: fileDoc.uploadTimestamp
      }
    });

  } catch (error) {
    console.error('[File Upload API] Error:', error);
    
    return NextResponse.json(
      { 
        error: "upload_failed",
        message: error.message || "File upload failed"
      },
      { status: 500 }
    );
  }
}
