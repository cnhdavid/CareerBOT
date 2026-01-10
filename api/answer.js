export const config = {
  runtime: 'edge',
};

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

async function getUserContext(userId) {
  if (!userId) return "";
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) return "";

    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(MONGODB_URI);
    
    await client.connect();
    const db = client.db();
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0, __v: 0, createdAt: 0 } }
    );
    
    await client.close();
    
    if (!user) return "";

    let userContext = "NUTZER-PROFIL:\n";
    
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
    
    return userContext;
  } catch (error) {
    console.error("Error fetching user context:", error);
    return "";
  }
}

function verifyToken(token) {
  if (!token) return null;
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    return payload.userId;
  } catch (error) {
    return null;
  }
}

function parseGuestSession(cookieHeader) {
  if (!cookieHeader) return { messageCount: 0 };
  
  const sessionMatch = cookieHeader.match(/guest_session=([^;]+)/);
  if (!sessionMatch) return { messageCount: 0 };
  
  try {
    return JSON.parse(decodeURIComponent(sessionMatch[1]));
  } catch {
    return { messageCount: 0 };
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { messages, roomId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cookieHeader = req.headers.get('cookie') || '';
    const authTokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
    const token = authTokenMatch ? authTokenMatch[1] : null;
    
    const userId = verifyToken(token);
    const isGuest = !userId;

    if (isGuest) {
      const guestSession = parseGuestSession(cookieHeader);
      const messageCount = (guestSession.messageCount || 0) + 1;
      
      const MAX_GUEST_MESSAGES = 10;
      if (messageCount > MAX_GUEST_MESSAGES) {
        return new Response(JSON.stringify({ 
          error: "Guest message limit reached. Please sign up to continue chatting.",
          limitReached: true
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': `guest_session=${encodeURIComponent(JSON.stringify({ messageCount }))};Path=/;Max-Age=86400;HttpOnly;SameSite=Strict`
          }
        });
      }
    }

    let userContext = "";
    if (!isGuest && userId) {
      userContext = await getUserContext(userId);
    }

    const conversationMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const enhancedSystemPrompt = userContext
      ? `${SYSTEM_PROMPT}\n\nNUTZER-KONTEXT: ${userContext}`
      : SYSTEM_PROMPT;
    
    const topic = detectTopic(conversationMessages);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          ...conversationMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        let fullText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullText += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, topic })}\n\n`));
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullText, topic })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    if (isGuest) {
      const guestSession = parseGuestSession(cookieHeader);
      const newMessageCount = (guestSession.messageCount || 0) + 1;
      headers['Set-Cookie'] = `guest_session=${encodeURIComponent(JSON.stringify({ messageCount: newMessageCount }))};Path=/;Max-Age=86400;HttpOnly;SameSite=Strict`;
    }

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: "OpenAI request failed" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
