import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/generate-job-filters
 * Body: { education: array, skills: string, targetPosition?: string }
 * Returns: { suggestions: string[] }
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { education, skills, targetPosition } = await request.json();

    if (!education && !skills) {
      return NextResponse.json(
        { error: "education or skills is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build context from education and skills
    let profileContext = "";

    if (Array.isArray(education) && education.length > 0) {
      profileContext += "Education:\n";
      education.forEach((edu) => {
        if (edu.degree || edu.field) {
          profileContext += `- ${edu.degree || "Degree"} in ${edu.field || "Not specified"}\n`;
        }
      });
    }

    if (skills) {
      profileContext += `\nSkills: ${skills}\n`;
    }

    if (targetPosition) {
      profileContext += `\nTarget Position: ${targetPosition}\n`;
    }

    console.log("[Job Filters] Generating suggestions with OpenAI...");

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a career advisor. Based on the user's profile, suggest 3-5 specific job search keywords or technologies that would be relevant for job searches. 
          
          Return ONLY a JSON object with a "suggestions" array of strings. Each suggestion should be:
          - A specific skill, technology, or job title
          - Short (1-3 words)
          - Relevant to job searches
          - In English
          
          Example format: {"suggestions": ["React Developer", "Full Stack", "DevOps", "Cloud Architecture"]}`,
        },
        {
          role: "user",
          content: `Based on this profile, what job search keywords would be most relevant?\n\n${profileContext}`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    console.log("[Job Filters] OpenAI response:", content);

    // Parse JSON response
    let suggestions = [];
    try {
      const parsed = JSON.parse(content);
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    } catch (e) {
      console.error("[Job Filters] Failed to parse OpenAI response:", e);
      // Try to extract suggestions from text
      const match = content.match(/\[".*?"\]/);
      if (match) {
        suggestions = JSON.parse(match[0]);
      }
    }

    return NextResponse.json({
      suggestions: suggestions.filter((s) => typeof s === "string" && s.length > 0),
    });
  } catch (err) {
    console.error("[Job Filters] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
