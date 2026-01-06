import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import { connectDB } from "./db.mjs";
import authRoutes from "./routes/auth.mjs";
import conversationRoutes from "./routes/conversations.mjs";
import User from "./models/User.mjs";
import { authenticateToken } from "./routes/auth.mjs";
import uploadRoutes from "./routes/upload.mjs";

const SYSTEM_PROMPT = `
DU BIST: Ein spezialisierter Karriere- und Bildungs-Chatbot. Dein Themenfokus ist strikt begrenzt auf:
1) Arbeitsmarkt & Berufswelt (z. B. Jobprofile, Branchen, Gehälter allgemein, Trends, Arbeitsrecht-Grundlagen nur allgemein, Unternehmensarten, Arbeitskultur, Vertragsarten, Rollen/Level, Skills)
2) Bewerbungsprozess (z. B. Lebenslauf, Anschreiben, Bewerbungsstrategien, Interviewvorbereitung, Gehaltsverhandlung, Assessment Center, LinkedIn/Xing, Portfolio, Follow-ups)
3) Bildungslaufbahnen (z. B. Schule–Ausbildung–Studium, Umschulung/Weiterbildung, Zertifikate, Bootcamps, duale Modelle, Anerkennung von Abschlüssen, Lernpfade, Studienwahl)

ZIEL: Gib präzise, praxisnahe und professionelle Antworten, die Nutzer:innen helfen, bessere Karriere-, Bewerbungs- oder Bildungsentscheidungen zu treffen.

WICHTIGSTE REGEL (THEMEN-GATEKEEPING):
- Antworte NUR auf Inhalte, die klar in die drei Bereiche fallen.
- Wenn eine Anfrage überwiegend außerhalb liegt (z. B. Medizin, Politik, Beziehung, Psychotherapie, Technik-Support ohne Karrierebezug, Unterhaltung, Finanzen/Investments, Recht im Detail, etc.), dann:
  1) Weise freundlich und professionell darauf hin, dass du dafür nicht zuständig bist.
  2) Erkläre kurz, welche Themen du stattdessen abdeckst.
  3) Biete eine hilfreiche Umformulierung an, die in deinen Fokus passt, oder stelle 1 kurze Rückfrage, um die Anfrage in einen Fokusbezug zu bringen.

UMGANG MIT GRENZFÄLLEN:
- Erlaubt sind angrenzende Themen, WENN sie direkt dem Fokus dienen, z. B.:
  - einfache Arbeitsrechts-Orientierung (ohne Rechtsberatung), Gesprächsführung, Stress im Bewerbungskontext (ohne Therapie), Grundzüge von Einkommen/Gehaltsbändern (ohne Anlageberatung).
- Wenn die Anfrage in eine heikle/hochrisiko Richtung geht (z. B. konkrete Rechts- oder Steuerberatung, Diagnosen, gefährliche Handlungen), dann:
  - keine detaillierte Anleitung geben, sondern zu professionellen Stellen verweisen (z. B. Rechtsberatung, Steuerberatung, Ärzt:innen) und auf den Karriere-/Bewerbungsbezug zurücklenken.

QUALITÄTSSTANDARDS:
- Klar, strukturiert, respektvoll, lösungsorientiert.
- Stelle bei unklaren Anfragen kurze, zielgerichtete Rückfragen (max. 2), aber mache auch ohne Rückfragen einen sinnvollen Vorschlag, wenn möglich.
- Verwende Checklisten, Beispiele und Templates, wenn passend (z. B. CV-Bullets, Anschreiben-Absätze, Interview-Antwort-Strukturen wie STAR).
- Wenn Informationen fehlen, sage das transparent und gib Annahmen an.

DATENSCHUTZ & PROFESSIONALITÄT:
- Fordere keine sensiblen Daten an (Ausweisnummern, vollständige Adresse, Gesundheitsdetails). Wenn Nutzer:innen so etwas teilen, erinnere sie daran, es zu anonymisieren.
- Kein herablassender Ton, keine Spekulationen über Personen/Unternehmen.
- Keine diskriminierenden Inhalte.

NUTZER-PROFIL NUTZUNG:
- Wenn ein NUTZER-PROFIL verfügbar ist, nutze diese Informationen, um personalisierte und relevante Antworten zu geben.
- Beziehe dich auf die bisherige Erfahrung, Ausbildung, Skills und Ziele des Nutzers.
- Passe deine Empfehlungen an den aktuellen Kenntnisstand, die Karrierestufe und die Ziele des Nutzers an.
- Verwende die Profilinformationen, um konkrete und umsetzbare Ratschläge zu geben (z. B. "Basierend auf deiner Erfahrung als...").
- Wenn der Nutzer nach Job- oder Studienrichtungen fragt, analysiere sein Profil und schlage passende Optionen vor, die zu seiner Erfahrung und seinen Zielen passen.

FORMATVORSCHLAG FÜR ANTWORTEN (falls sinnvoll):
1) Kurze Einordnung / Ziel
2) Konkrete Empfehlungen (Schritte)
3) Beispiel / Vorlage
4) Nächster Schritt (eine Frage oder To-do)

STANDARD-ABLEHNUNG (außerhalb des Fokus) – nutze sinngemäß:
"Ich bin auf Arbeitsmarkt, Bewerbungsprozess und Bildungslaufbahnen spezialisiert und kann bei [Thema außerhalb] leider nicht helfen. Wenn du möchtest, kann ich dir aber bei [relevante Alternativen] helfen. Magst du kurz sagen, ob es dir um Jobwechsel, Bewerbung oder Weiterbildung geht?"

SPRACHE:
- Antworte standardmäßig auf Deutsch (außer der/die Nutzer:in wünscht explizit eine andere Sprache).
`.trim();


// ✅ lädt garantiert CareerBOT/server/.env
const envPath = new URL("./.env", import.meta.url);
dotenv.config({ path: envPath });

// Log environment loading status
console.log("📄 Loading environment from:", envPath.pathname);
console.log("🔍 MONGODB_URI loaded:", process.env.MONGODB_URI ? "Yes" : "No");

// Connect to MongoDB (non-blocking)
connectDB().catch(console.error);

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Auth routes
app.use("/api/auth", authRoutes);

// Conversation routes
app.use("/api/conversations", conversationRoutes);

// Upload routes
app.use("/api/upload", uploadRoutes);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/answer", authenticateToken, async (req, res) => {
function detectTopic(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
  const text = lastUser.toLowerCase();

  // lightweight keyword detection for MVP
  if (/(software|programm|coding|code|entwickl|developer|it|informatik|data|ki|ai|cloud|devops|cyber|security|netzwerk|sql)/i.test(text)) {
    return "IT";
  }
  if (/(medizin|pflege|arzt|ärztin|krankenhaus|patient|therapie|pharma)/i.test(text)) {
    return "Medicine";
  }
  if (/(wirtschaft|business|bwl|management|marketing|sales|finance|controlling|startup)/i.test(text)) {
    return "Business";
  }
  if (/(studium|uni|fh|hochschule|ausbildung|weiterbildung|zertifikat|kurs|bootcamp)/i.test(text)) {
    return "Education";
  }
  if (/(bewerbung|lebenslauf|cv|anschreiben|interview|vorstellungsgespräch|assessment|gehaltsverhandlung|linkedin)/i.test(text)) {
    return "Application";
  }

  return "Other";
}
  try {
    const { messages } = req.body ?? {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages required" });
    }

    // Fetch user data for comprehensive profile information
    const user = await User.findById(req.userId).select("-password -__v -createdAt");
    let userContext = "";
    if (user) {
      userContext += "NUTZER-PROFIL:\n";
      
      // Basic information
      if (user.name || user.surname) {
        userContext += `Name: ${user.name || ""} ${user.surname || ""}\n`;
      }
      
      // Contact information
      if (user.phone) userContext += `Telefon: ${user.phone}\n`;
      if (user.email) userContext += `Email: ${user.email}\n`;
      if (user.address || user.city || user.country || user.postalCode) {
        userContext += `Adresse: ${user.address || ""}, ${user.city || ""} ${user.postalCode || ""}, ${user.country || ""}\n`;
      }
      
      // Professional profiles
      if (user.linkedin) userContext += `LinkedIn: ${user.linkedin}\n`;
      if (user.github) userContext += `GitHub: ${user.github}\n`;
      if (user.portfolio) userContext += `Portfolio: ${user.portfolio}\n`;
      
      // Career information
      if (user.targetPosition) {
        userContext += `Zielposition: ${user.targetPosition}\n`;
      }
      if (user.summary) {
        userContext += `Zusammenfassung: ${user.summary}\n`;
      }
      
      // Experience
      if (user.experience && user.experience.length > 0) {
        userContext += "\nBerufserfahrung:\n";
        user.experience.forEach((exp, index) => {
          userContext += `${index + 1}. ${exp.position} bei ${exp.company} (${exp.startDate} - ${exp.endDate || 'heute'})\n`;
          if (exp.description) userContext += `   Beschreibung: ${exp.description}\n`;
        });
      }
      
      // Education
      if (user.education && user.education.length > 0) {
        userContext += "\nAusbildung:\n";
        user.education.forEach((edu, index) => {
          userContext += `${index + 1}. ${edu.degree} in ${edu.field} bei ${edu.institution} (${edu.startDate} - ${edu.endDate || 'heute'})\n`;
          if (edu.gpa) userContext += `   Note: ${edu.gpa}\n`;
        });
      }
      
      // Skills and qualifications
      if (user.skills) userContext += `\nSkills: ${user.skills}\n`;
      if (user.languages) userContext += `Sprachen: ${user.languages}\n`;
      if (user.certifications) userContext += `Zertifikate: ${user.certifications}\n`;
      if (user.references) userContext += `Referenzen: ${user.references}\n`;
      
      // CV information
      if (user.cvText) {
        userContext += `\nCV Text: ${user.cvText}\n`;
      }
      if (user.cvFile) {
        userContext += `CV Datei verfügbar: ${user.cvFile}\n`;
      }
      
      userContext += "\n=== ENDE DES NUTZER-PROFILS ===\n";
    }

    const conversationMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const enhancedSystemPrompt = userContext
      ? `${SYSTEM_PROMPT}\n\nNUTZER-KONTEXT: ${userContext}`
      : SYSTEM_PROMPT;
    
    const topic = detectTopic(conversationMessages);

    const response = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  messages: [
    { role: "system", content: enhancedSystemPrompt },
    ...conversationMessages,
  ],
});


    res.json({ text: response.choices[0]?.message?.content ?? "", topic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

// CV Analysis endpoint
app.post("/api/analyze-cv", authenticateToken, upload.single('cvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "CV file is required" });
    }

    // Read the uploaded file
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), req.file.path);
    const fileBuffer = fs.readFileSync(filePath);
    
    let cvText = "";
    
    // Extract text from different file types
    if (req.file.mimetype === 'text/plain') {
      cvText = fileBuffer.toString('utf-8');
    } else if (req.file.mimetype === 'application/pdf') {
      try {
        // Use pdf-parse to extract text from PDF
        const pdfParse = await import('pdf-parse');
        const pdfData = await pdfParse.default(fileBuffer);
        cvText = pdfData.text;
        console.log('PDF text extracted successfully, length:', cvText.length);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        cvText = `PDF file uploaded: ${req.file.originalname}. Error extracting text: ${pdfError.message}`;
      }
    } else if (req.file.mimetype === 'application/msword' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For Word documents, we'd need mammoth.js or similar, but for now:
      cvText = `Word document uploaded: ${req.file.originalname}. Note: Word document parsing requires additional libraries.`;
    } else {
      cvText = `Document uploaded: ${req.file.originalname}. File type: ${req.file.mimetype}`;
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    // Use OpenAI to analyze the CV and extract structured data
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
    
    // Clean up the response to handle markdown code blocks
    let cleanedText = analysisText.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log("Cleaned OpenAI response:", cleanedText);
    
    try {
      const parsedData = JSON.parse(cleanedText);
      res.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Original response:", analysisText);
      console.error("Cleaned response:", cleanedText);
      res.status(500).json({ error: "Failed to parse CV analysis" });
    }
  } catch (err) {
    console.error("CV Analysis error:", err);
    res.status(500).json({ error: "CV analysis failed" });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
