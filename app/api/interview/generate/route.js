import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/lib/auth";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INTERVIEW_QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    job_title: { type: "string", description: "The job title being interviewed for" },
    question_count: { type: "number", description: "Number of questions generated" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique question identifier" },
          type: {
            type: "string",
            enum: ["behavioral", "technical", "situational", "communication", "closing"],
            description: "Type of interview question"
          },
          question: { type: "string", description: "The interview question" },
          what_good_looks_like: {
            type: "array",
            items: { type: "string" },
            description: "Key points a strong answer would include"
          },
          scoring_rubric: {
            type: "array",
            items: { type: "string" },
            description: "What interviewers would evaluate"
          }
        },
        required: ["id", "type", "question", "what_good_looks_like", "scoring_rubric"],
        additionalProperties: false
      },
      description: "Array of interview questions"
    }
  },
  required: ["job_title", "question_count", "questions"],
  additionalProperties: false
};

export async function POST(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(userId).select("targetPosition experience education skills summary");
    
    if (!user || !user.targetPosition) {
      return NextResponse.json(
        { error: "No target job saved. Please update your profile." },
        { status: 400 }
      );
    }

    // Build user context from profile
    let userContext = `Target Position: ${user.targetPosition}\n`;
    
    if (user.summary) {
      userContext += `Professional Summary: ${user.summary}\n`;
    }
    
    if (user.skills) {
      userContext += `Skills: ${user.skills}\n`;
    }
    
    if (user.experience && user.experience.length > 0) {
      userContext += `Years of Experience: ${user.experience.length} positions\n`;
      const highestPosition = user.experience.reduce((max, exp) => 
        exp.position.length > max.position.length ? exp : max, user.experience[0]);
      userContext += `Most Recent Role: ${highestPosition.position} at ${highestPosition.company}\n`;
    }
    
    if (user.education && user.education.length > 0) {
      const latestEdu = user.education[user.education.length - 1];
      userContext += `Education: ${latestEdu.degree} in ${latestEdu.field}\n`;
    }

    const systemPrompt = `You are an expert technical interview coach and hiring manager. Generate a professional, realistic interview for a ${user.targetPosition} position.

Create 7 interview questions that are:
- Tailored to the specific role and candidate background
- Mix of behavioral, technical, situational, and communication questions
- Realistic and fair (no age/family/discriminatory questions)
- End with a professional closing question

Focus on questions that reveal competence, cultural fit, and growth potential.

User Context:
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
          content: `Generate 7 interview questions for a ${user.targetPosition} role. Return the result as valid JSON matching this schema: ${JSON.stringify(INTERVIEW_QUESTIONS_SCHEMA)}`
        }
      ],
      temperature: 1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "InterviewQuestions",
          schema: INTERVIEW_QUESTIONS_SCHEMA,
          strict: true
        }
      }
    });

    // Extract the text content from the response
    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      return NextResponse.json(
        { error: "Failed to generate interview questions" },
        { status: 500 }
      );
    }

    let questionsData;
    try {
      questionsData = JSON.parse(textContent);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      return NextResponse.json(
        { error: "Failed to parse generated questions" },
        { status: 500 }
      );
    }

    return NextResponse.json(questionsData);
  } catch (error) {
    console.error("Interview generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}
