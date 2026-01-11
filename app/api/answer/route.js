import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/lib/auth";
import { SYSTEM_PROMPT } from "@/lib/constants";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function detectTopic(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
  const text = lastUser.toLowerCase();

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

export async function POST(request) {
  try {
    const { messages, roomId } = await request.json();
    const userId = await getCurrentUser();
    const isGuest = !userId;
    
    console.log("📥 Chat API request:", { 
      messageCount: messages?.length, 
      roomId,
      userId,
      isGuest 
    });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages required" },
        { status: 400 }
      );
    }

    let userContext = "";
    if (!isGuest && userId) {
      await connectDB();
      const user = await User.findById(userId).select("-password -__v -createdAt");
      if (user) {
        userContext += "NUTZER-PROFIL:\n";
        
        if (user.name || user.surname) {
          userContext += `Name: ${user.name || ""} ${user.surname || ""}\n`;
        }
        
        if (user.phone) userContext += `Telefon: ${user.phone}\n`;
        if (user.email) userContext += `Email: ${user.email}\n`;
        if (user.address || user.city || user.country || user.postalCode) {
          userContext += `Adresse: ${user.address || ""}, ${user.city || ""} ${user.postalCode || ""}, ${user.country || ""}\n`;
        }
        
        if (user.linkedin) userContext += `LinkedIn: ${user.linkedin}\n`;
        if (user.github) userContext += `GitHub: ${user.github}\n`;
        if (user.portfolio) userContext += `Portfolio: ${user.portfolio}\n`;
        
        if (user.targetPosition) {
          userContext += `Zielposition: ${user.targetPosition}\n`;
        }
        if (user.summary) {
          userContext += `Zusammenfassung: ${user.summary}\n`;
        }
        
        if (user.experience && user.experience.length > 0) {
          userContext += "\nBerufserfahrung:\n";
          user.experience.forEach((exp, index) => {
            userContext += `${index + 1}. ${exp.position} bei ${exp.company} (${exp.startDate} - ${exp.endDate || 'heute'})\n`;
            if (exp.description) userContext += `   Beschreibung: ${exp.description}\n`;
          });
        }
        
        if (user.education && user.education.length > 0) {
          userContext += "\nAusbildung:\n";
          user.education.forEach((edu, index) => {
            userContext += `${index + 1}. ${edu.degree} in ${edu.field} bei ${edu.institution} (${edu.startDate} - ${edu.endDate || 'heute'})\n`;
            if (edu.gpa) userContext += `   Note: ${edu.gpa}\n`;
          });
        }
        
        if (user.skills) userContext += `\nSkills: ${user.skills}\n`;
        if (user.languages) userContext += `Sprachen: ${user.languages}\n`;
        if (user.certifications) userContext += `Zertifikate: ${user.certifications}\n`;
        if (user.references) userContext += `Referenzen: ${user.references}\n`;
        
        if (user.cvText) {
          userContext += `\nCV Text: ${user.cvText}\n`;
        }
        if (user.cvFile) {
          userContext += `CV Datei verfügbar: ${user.cvFile}\n`;
        }
        
        userContext += "\n=== ENDE DES NUTZER-PROFILS ===\n";
      }
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

    return NextResponse.json({ 
      text: response.choices[0]?.message?.content ?? "", 
      topic 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "OpenAI request failed" },
      { status: 500 }
    );
  }
}
