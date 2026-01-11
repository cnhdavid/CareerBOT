import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import PDFParser from "pdf2json";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    console.log('[CV Analysis] Starting CV analysis request');
    
    const userId = await getCurrentUser();
    
    if (!userId) {
      console.log('[CV Analysis] Unauthorized - no user ID');
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      );
    }

    console.log('[CV Analysis] User authenticated:', userId);

    const formData = await request.formData();
    const cvFile = formData.get('cvFile');
    
    if (!cvFile) {
      console.log('[CV Analysis] No CV file in request');
      return NextResponse.json(
        { error: "CV file is required" },
        { status: 400 }
      );
    }

    console.log('[CV Analysis] File received:', {
      name: cvFile.name,
      type: cvFile.type,
      size: cvFile.size
    });

    const fileBuffer = await cvFile.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    console.log('[CV Analysis] Buffer created, size:', buffer.length);
    
    let cvText = "";
    
    if (cvFile.type === 'text/plain') {
      console.log('[CV Analysis] Processing as text file');
      cvText = buffer.toString('utf-8');
      console.log('[CV Analysis] Text extracted, length:', cvText.length);
    } else if (cvFile.type === 'application/pdf') {
      console.log('[CV Analysis] Processing as PDF file');
      try {
        // Use pdf2json for Next.js compatibility
        const pdfParser = new PDFParser();
        
        // Wrap parseBuffer in a Promise
        cvText = await new Promise((resolve, reject) => {
          pdfParser.on('pdfParser_dataError', (errData) => {
            console.error('[CV Analysis] PDF parser error:', errData.parserError);
            reject(new Error(errData.parserError));
          });
          
          pdfParser.on('pdfParser_dataReady', (pdfData) => {
            try {
              console.log('[CV Analysis] PDF data ready, extracting text...');
              
              // Extract text from all pages
              let extractedText = '';
              
              if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
                console.log('[CV Analysis] PDF loaded, pages:', pdfData.Pages.length);
                
                pdfData.Pages.forEach((page, pageIndex) => {
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
                    console.log(`[CV Analysis] Page ${pageIndex + 1}/${pdfData.Pages.length} extracted, length: ${pageText.length}`);
                  }
                });
              }
              
              const finalText = extractedText.trim();
              console.log('[CV Analysis] PDF text extracted successfully, total length:', finalText.length);
              
              if (!finalText) {
                reject(new Error('No text could be extracted from the PDF. The PDF may be image-based or corrupted.'));
              } else {
                resolve(finalText);
              }
            } catch (extractError) {
              console.error('[CV Analysis] Text extraction error:', extractError);
              reject(extractError);
            }
          });
          
          // Parse the buffer
          console.log('[CV Analysis] Starting PDF parsing...');
          pdfParser.parseBuffer(buffer);
        });
        
      } catch (pdfError) {
        console.error('[CV Analysis] PDF parsing error:', pdfError);
        console.error('[CV Analysis] PDF error stack:', pdfError.stack);
        return NextResponse.json(
          { 
            error: `Failed to parse PDF: ${pdfError.message}. Please ensure the PDF contains selectable text and is not corrupted.`,
            details: pdfError.name 
          },
          { status: 400 }
        );
      }
    } else if (cvFile.type === 'application/msword' || cvFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('[CV Analysis] Processing as Word document');
      try {
        // Dynamic import for mammoth to avoid bundling issues
        const mammoth = await import('mammoth');
        const mammothLib = mammoth.default || mammoth;
        
        const result = await mammothLib.extractRawText({ buffer });
        cvText = result.value || "";
        console.log('[CV Analysis] Word text extracted, length:', cvText.length);
        
        if (!cvText) {
          throw new Error('No text could be extracted from the Word document.');
        }
      } catch (wordError) {
        console.error('[CV Analysis] Word parsing error:', wordError);
        console.error('[CV Analysis] Word error stack:', wordError.stack);
        return NextResponse.json(
          { 
            error: `Failed to parse Word document: ${wordError.message}. Please ensure the document is not corrupted.`,
            details: wordError.name
          },
          { status: 400 }
        );
      }
    } else {
      console.log('[CV Analysis] Unsupported file type:', cvFile.type);
      return NextResponse.json(
        { error: `Unsupported file type: ${cvFile.type}. Please upload PDF, DOCX, or TXT files.` },
        { status: 400 }
      );
    }

    if (!cvText || cvText.trim().length === 0) {
      console.log('[CV Analysis] No text extracted from file');
      return NextResponse.json(
        { error: "Could not extract text from the file. The file may be empty or corrupted." },
        { status: 400 }
      );
    }

    console.log('[CV Analysis] Text extraction successful, preview:', cvText.substring(0, 200));
    console.log('[CV Analysis] Extracted Text length:', cvText.length);

    const analysisPrompt = `
    You are a CV/resume analysis expert. Extract REAL information from the following CV text.

    CV TEXT TO ANALYZE:
    ${cvText}

    YOUR TASK:
    Extract ONLY the information that is actually present in the CV text above.
    Do NOT make up, invent, or generate any information that is not explicitly stated in the text.
    If information is not found, use empty strings or empty arrays.

    REQUIRED JSON FORMAT:
    {
      "name": "",
      "surname": "",
      "phone": "",
      "address": "",
      "city": "",
      "country": "",
      "postalCode": "",
      "email": "",
      "linkedin": "",
      "github": "",
      "portfolio": "",
      "summary": "",
      "targetPosition": "",
      "experience": [
        {
          "company": "",
          "position": "",
          "startDate": "",
          "endDate": "",
          "description": ""
        }
      ],
      "education": [
        {
          "institution": "",
          "degree": "",
          "field": "",
          "startDate": "",
          "endDate": "",
          "gpa": ""
        }
      ],
      "skills": "",
      "languages": "",
      "certifications": "",
      "references": ""
    }

    CRITICAL INSTRUCTIONS:
    1. Extract ONLY information that is explicitly written in the CV text
    2. Do NOT generate or invent any data
    3. If a field is not mentioned in the CV, leave it as an empty string
    4. For dates, use the exact format found in the CV or convert to MM/YYYY
    5. Return ONLY the JSON object - no markdown, no explanations
    6. Be precise and accurate - this is for real user data
    `;

    console.log('[CV Analysis] Sending request to OpenAI...');
    
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a CV analysis expert. Extract information accurately and return only valid JSON." },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.1
    });

    console.log('[CV Analysis] OpenAI response received');

    const analysisText = response.choices[0]?.message?.content || "{}";
    
    console.log('[CV Analysis] Raw OpenAI response length:', analysisText.length);
    
    let cleanedText = analysisText.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('[CV Analysis] Cleaned response preview:', cleanedText.substring(0, 200));
    
    try {
      const parsedData = JSON.parse(cleanedText);
      
      console.log('[CV Analysis] JSON parsed successfully');
      console.log('[CV Analysis] Extracted data summary:', {
        hasName: !!parsedData.name,
        hasSurname: !!parsedData.surname,
        experienceCount: parsedData.experience?.length || 0,
        educationCount: parsedData.education?.length || 0,
        hasSkills: !!parsedData.skills
      });
      
      return NextResponse.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error('[CV Analysis] Failed to parse OpenAI response:', parseError);
      console.error('[CV Analysis] Original response:', analysisText);
      console.error('[CV Analysis] Cleaned response:', cleanedText);
      return NextResponse.json(
        { error: "Failed to parse CV analysis. The AI response was not in the expected format." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('[CV Analysis] Unexpected error:', err);
    console.error('[CV Analysis] Error stack:', err.stack);
    return NextResponse.json(
      { error: `CV analysis failed: ${err.message}` },
      { status: 500 }
    );
  }
}
