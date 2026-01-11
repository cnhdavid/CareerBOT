import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const cvFile = formData.get('cvFile');
    
    if (!cvFile) {
      return NextResponse.json(
        { error: "CV file is required" },
        { status: 400 }
      );
    }

    const fileBuffer = await cvFile.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    let cvText = "";
    
    if (cvFile.type === 'text/plain') {
      cvText = buffer.toString('utf-8');
    } else if (cvFile.type === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        cvText = pdfData.text;
        console.log('PDF text extracted successfully, length:', cvText.length);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        cvText = `PDF file uploaded: ${cvFile.name}. Error extracting text: ${pdfError.message}`;
      }
    } else if (cvFile.type === 'application/msword' || cvFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cvText = `Word document uploaded: ${cvFile.name}. Note: Word document parsing requires additional libraries.`;
    } else {
      cvText = `Document uploaded: ${cvFile.name}. File type: ${cvFile.type}`;
    }

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

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a CV analysis expert. Extract information accurately and return only valid JSON." },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.1
    });

    const analysisText = response.choices[0]?.message?.content || "{}";
    
    let cleanedText = analysisText.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log("Cleaned OpenAI response:", cleanedText);
    
    try {
      const parsedData = JSON.parse(cleanedText);
      return NextResponse.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Original response:", analysisText);
      console.error("Cleaned response:", cleanedText);
      return NextResponse.json(
        { error: "Failed to parse CV analysis" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("CV Analysis error:", err);
    return NextResponse.json(
      { error: "CV analysis failed" },
      { status: 500 }
    );
  }
}
