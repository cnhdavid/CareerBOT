import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import pdfParse from "pdf-parse";

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
        // Use pdf-parse for better text extraction
        console.log('[CV Analysis] Starting PDF parsing with pdf-parse...');
        const pdfData = await pdfParse(buffer);
        
        cvText = pdfData.text || "";
        console.log('[CV Analysis] PDF text extracted successfully, length:', cvText.length);
        console.log('[CV Analysis] PDF pages:', pdfData.numpages);
        
        if (!cvText || cvText.trim().length === 0) {
          throw new Error('No text could be extracted from the PDF. The PDF may be image-based, password-protected, or corrupted.');
        }
        
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
    console.log('[CV Analysis] Full extracted text (first 1000 chars):', cvText.substring(0, 1000));
    console.log('[CV Analysis] Full extracted text (last 500 chars):', cvText.substring(Math.max(0, cvText.length - 500)));

    const analysisPrompt = `
    You are an expert CV/resume parser. Carefully analyze the following CV text and extract ALL available information.

    CV TEXT TO ANALYZE:
    ${cvText}

    EXTRACTION GUIDELINES:
    1. **Personal Information**: Look for name (first and last name), phone numbers, email addresses, physical addresses, city, country, postal codes
    2. **Professional Profiles**: Extract LinkedIn, GitHub, portfolio URLs, or any social media links
    3. **Summary/Objective**: Look for professional summary, career objective, or "About Me" sections
    4. **Work Experience**: Extract ALL job positions with:
       - Company/employer name
       - Job title/position
       - Start and end dates (convert to YYYY-MM format if possible, e.g., "2020-01" for January 2020)
       - Job description, responsibilities, and achievements
    5. **Education**: Extract ALL educational background with:
       - Institution/university name
       - Degree type (Bachelor's, Master's, PhD, etc.)
       - Field of study/major
       - Start and end dates (YYYY-MM format)
       - GPA or grades if mentioned
    6. **Skills**: Extract technical skills, soft skills, tools, technologies, programming languages
    7. **Languages**: Extract spoken/written languages with proficiency levels if mentioned
    8. **Certifications**: Extract professional certifications, licenses, courses
    9. **Target Position**: Look for desired position, job title seeking, or career goals

    IMPORTANT NOTES:
    - The CV may be in German or English - extract information from both languages
    - Common German terms: "Berufserfahrung" (work experience), "Ausbildung" (education), "Fähigkeiten" (skills), "Sprachen" (languages)
    - Be thorough - extract ALL work experiences and education entries, not just the most recent
    - For dates: "seit" or "since" means ongoing (use empty string for endDate)
    - Combine related information intelligently (e.g., multiple skill mentions into one skills field)
    - If multiple entries exist for experience or education, include ALL of them in the arrays

    REQUIRED JSON FORMAT:
    {
      "name": "First name only",
      "surname": "Last name only",
      "phone": "Phone number with country code if available",
      "address": "Street address",
      "city": "City name",
      "country": "Country name",
      "postalCode": "Postal/ZIP code",
      "email": "Email address",
      "linkedin": "LinkedIn URL",
      "github": "GitHub URL",
      "portfolio": "Portfolio or personal website URL",
      "summary": "Professional summary or objective",
      "targetPosition": "Desired job title or position",
      "experience": [
        {
          "company": "Company name",
          "position": "Job title",
          "startDate": "YYYY-MM format",
          "endDate": "YYYY-MM format or empty if current",
          "description": "Job responsibilities and achievements"
        }
      ],
      "education": [
        {
          "institution": "School/University name",
          "degree": "Degree type",
          "field": "Field of study",
          "startDate": "YYYY-MM format",
          "endDate": "YYYY-MM format",
          "gpa": "Grade or GPA if mentioned"
        }
      ],
      "skills": "Comma-separated list of all skills",
      "languages": "Comma-separated list of languages with proficiency",
      "certifications": "List of certifications and courses",
      "references": "Reference information if provided"
    }

    CRITICAL RULES:
    1. Extract ONLY information actually present in the CV text - do NOT invent data
    2. If a field is not found, use empty string "" or empty array []
    3. Be thorough and extract ALL instances (all jobs, all education entries)
    4. Return ONLY valid JSON - no markdown formatting, no explanations, no code blocks
    5. Ensure all strings are properly escaped for JSON
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
    console.log('[CV Analysis] Raw OpenAI response (full):', analysisText);
    
    let cleanedText = analysisText.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('[CV Analysis] Cleaned response preview:', cleanedText.substring(0, 200));
    console.log('[CV Analysis] Cleaned response (full):', cleanedText);
    
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
