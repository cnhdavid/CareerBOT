import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/lib/auth";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INTERVIEW_REVIEW_SCHEMA = {
  type: "object",
  properties: {
    job_title: { type: "string", description: "The job title being interviewed for" },
    overall_rating: {
      type: "string",
      enum: ["Strong", "Mixed", "Needs work"],
      description: "Overall assessment rating"
    },
    overall_score: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Overall score from 0-100"
    },
    score_breakdown: {
      type: "object",
      properties: {
        communication: { type: "number", minimum: 0, maximum: 100, description: "Score for communication clarity and articulation" },
        role_knowledge: { type: "number", minimum: 0, maximum: 100, description: "Score for technical knowledge and role-specific expertise" },
        structure: { type: "number", minimum: 0, maximum: 100, description: "Score for answer structure and organization" },
        impact: { type: "number", minimum: 0, maximum: 100, description: "Score for demonstrating measurable impact and results" }
      },
      required: ["communication", "role_knowledge", "structure", "impact"],
      additionalProperties: false,
      description: "Breakdown of scores across key dimensions"
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "Key strengths demonstrated across answers"
    },
    improvements: {
      type: "array",
      items: { type: "string" },
      description: "Areas where candidate could improve"
    },
    next_steps: {
      type: "array",
      items: { type: "string" },
      description: "Concrete practice actions and improvements to work on"
    },
    question_feedback: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question_id: { type: "string", description: "Unique identifier for the question" },
          question: { type: "string", description: "The interview question asked" },
          answer_summary: { type: "string", description: "Brief summary of what the candidate said" },
          score: { type: "number", minimum: 0, maximum: 100, description: "Score for this specific answer (0-100)" },
          what_you_did_well: {
            type: "array",
            items: { type: "string" },
            description: "Specific strengths in this answer (3-5 bullets)"
          },
          what_to_improve: {
            type: "array",
            items: { type: "string" },
            description: "Specific areas for improvement in this answer (3-5 bullets)"
          },
          missing_signal: {
            type: "array",
            items: { type: "string" },
            description: "Important information or context not covered in the answer (2-4 bullets)"
          },
          suggested_better_answer: { type: "string", description: "A concise example of a stronger response (2-3 sentences)" },
          tags: {
            type: "array",
            items: { 
              type: "string",
              enum: ["STAR", "metrics", "clarity", "depth", "stakeholders", "impact", "technical", "communication"]
            },
            description: "Tags indicating key evaluation areas for this answer"
          }
        },
        required: ["question_id", "question", "answer_summary", "score", "what_you_did_well", "what_to_improve", "missing_signal", "suggested_better_answer", "tags"],
        additionalProperties: false
      },
      description: "Detailed feedback for each question answered"
    }
  },
  required: [
    "job_title",
    "overall_rating",
    "overall_score",
    "score_breakdown",
    "strengths",
    "improvements",
    "next_steps",
    "question_feedback"
  ],
  additionalProperties: false
};

// Helper to truncate long answers to avoid token limits
function truncateAnswer(answer, maxChars = 500) {
  if (answer.length > maxChars) {
    return answer.substring(0, maxChars) + "...";
  }
  return answer;
}

export async function POST(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobTitle, questions, answers } = await request.json();

    if (!jobTitle || !questions || !answers || !Array.isArray(questions) || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing required fields: jobTitle, questions, answers" },
        { status: 400 }
      );
    }

    if (questions.length !== answers.length) {
      return NextResponse.json(
        { error: "Question count must match answer count" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(userId).select("experience education skills summary targetPosition");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build user context
    let userContext = `Target Position: ${jobTitle}\n`;
    
    if (user.summary) {
      userContext += `Professional Summary: ${user.summary}\n`;
    }
    
    if (user.skills) {
      userContext += `Skills: ${user.skills}\n`;
    }
    
    if (user.experience && user.experience.length > 0) {
      userContext += `Years of Experience: ${user.experience.length} positions\n`;
    }

    // Build Q&A context
    let qaContext = "Interview Questions and Answers:\n\n";
    questions.forEach((q, index) => {
      const questionText = q.question || q;
      const answer = truncateAnswer(answers[index] || "No answer provided", 500);
      qaContext += `Q${index + 1}: ${questionText}\nA${index + 1}: ${answer}\n\n`;
    });

    const systemPrompt = `You are an experienced hiring manager and interview coach. Your role is to provide constructive, honest, and actionable feedback on interview performance.

CRITICAL INSTRUCTIONS:
1. Provide per-question feedback for EVERY question answered (100% coverage required)
2. Ground all feedback ONLY in what the candidate actually said - do not invent accomplishments or assume unstated experience
3. For each question, provide:
   - A fair, honest score (0-100) based on the answer quality
   - 3-5 specific strengths demonstrated in THIS answer
   - 3-5 specific areas for improvement
   - 2-4 missing signals (important context not provided)
   - A realistic, concise suggested better answer (2-3 sentences)
   - Relevant tags (STAR, metrics, clarity, depth, etc.)
4. Score breakdown dimensions:
   - communication: clarity of expression, articulation, structure
   - role_knowledge: technical depth and relevance to the ${jobTitle} role
   - structure: organization of thoughts, use of frameworks (e.g., STAR)
   - impact: evidence of measurable results and business value
5. Be honest: if answers are vague, weak, or missing information, explicitly call that out

${userContext}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please provide a detailed, per-question review of this ${jobTitle} interview.\n\n${qaContext}\n\nIMPORTANT: Include feedback for EVERY single question. Return valid JSON matching the provided schema.`
        }
      ],
      temperature: 1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "InterviewReview",
          schema: INTERVIEW_REVIEW_SCHEMA,
          strict: true
        }
      }
    });

    // Extract the text content
    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      return NextResponse.json(
        { error: "Failed to generate review" },
        { status: 500 }
      );
    }

    let reviewData;
    try {
      reviewData = JSON.parse(textContent);
    } catch (e) {
      console.error("Failed to parse OpenAI review response:", e);
      return NextResponse.json(
        { error: "Failed to parse review" },
        { status: 500 }
      );
    }

    return NextResponse.json(reviewData);
  } catch (error) {
    console.error("Interview review error:", error);
    return NextResponse.json(
      { error: "Failed to generate interview review" },
      { status: 500 }
    );
  }
}
