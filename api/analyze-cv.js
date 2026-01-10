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
      
      const files = {};
      
      for (const part of parts) {
        if (part.includes('Content-Disposition') && part.includes('filename=')) {
          const nameMatch = part.match(/name="([^"]+)"/);
          const filenameMatch = part.match(/filename="([^"]+)"/);
          
          if (nameMatch && filenameMatch) {
            const name = nameMatch[1];
            const filename = filenameMatch[1];
            const mimeMatch = part.match(/Content-Type: ([^\r\n]+)/);
            const mimetype = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
            
            const contentStart = part.indexOf('\r\n\r\n') + 4;
            const contentEnd = part.lastIndexOf('\r\n');
            const content = part.substring(contentStart, contentEnd);
            
            files[name] = {
              originalname: filename,
              mimetype,
              buffer: Buffer.from(content, 'binary'),
              size: Buffer.from(content, 'binary').length
            };
          }
        }
      }
      
      resolve({ files });
    });
    req.on('error', reject);
  });
}

async function extractText(file) {
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();

  if (ext === '.txt' || file.mimetype === 'text/plain') {
    return file.buffer.toString('utf-8');
  }

  if (ext === '.pdf' || file.mimetype === 'application/pdf') {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(file.buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return `PDF file uploaded: ${file.originalname}. Error extracting text: ${error.message}`;
    }
  }

  if (ext === '.docx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return `Word document uploaded: ${file.originalname}. Note: Word document parsing requires additional libraries.`;
  }

  return `Document uploaded: ${file.originalname}. File type: ${file.mimetype}`;
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
    const { files } = await parseMultipartForm(req);
    const file = files.cvFile;

    if (!file) {
      return res.status(400).json({ error: "CV file is required" });
    }

    const cvText = await extractText(file);

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a CV analysis expert. Extract information accurately and return only valid JSON." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.1
      }),
    });

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || "{}";
    
    let cleanedText = analysisText.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      const parsedData = JSON.parse(cleanedText);
      res.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      res.status(500).json({ error: "Failed to parse CV analysis" });
    }
  } catch (err) {
    console.error("CV Analysis error:", err);
    res.status(500).json({ error: "CV analysis failed" });
  }
}
