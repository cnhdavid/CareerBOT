import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/match-jobs
 * Body: { userProfile: object, jobs: array }
 * Returns: { recommendations: array }
 * 
 * Implements semantic job matching with weighted scoring:
 * - Role Alignment: 40%
 * - Seniority Calibration: 20%
 * - Skill Ecosystems: 20%
 * - Industry & Domain Fit: 20%
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

    const { userProfile, jobs } = await request.json();

    if (!userProfile || !jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: "userProfile and jobs array are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("[Job Matching] Processing", jobs.length, "jobs for semantic matching...");

    // Build comprehensive user profile context
    const profileContext = buildProfileContext(userProfile);

    // System prompt implementing the semantic matching requirements
    const systemPrompt = `Role: You are a Senior Talent Matching Engine & Recommendation Specialist. Your goal is to act as the intelligence layer between a Job API and a User Discovery Page.

Task: Analyze the provided User Profile and the JSON Job Feed. You must discard simple keyword-matching logic and implement a Latent Semantic Analysis approach to identify the best career fits.

Matching Dimensions (Weighted Priority):

1. Role Alignment (40%): Does the user's career trajectory align with the job's core responsibilities? Look for semantic synonyms (e.g., "Account Executive" matches "Sales Manager", "Frontend Developer" matches "React Engineer").

2. Seniority Calibration (20%): Ensure the years of experience and level of responsibility (Junior, Mid, Senior, C-Level) match. Do not recommend entry-level roles to experts or vice versa.

3. Skill Ecosystems (20%): Map skill clusters. If a user knows "React," they are a fit for "Frontend" ecosystems even if "TypeScript" isn't explicitly in their profile but is in the job description. Consider related technologies and transferable skills.

4. Industry & Domain Fit (20%): Prioritize jobs in sectors where the user has prior experience (e.g., SaaS, FinTech, Healthcare).

Operational Constraints:

- Threshold: Only return jobs with a calculated Match Score > 0.75.
- Diversity: Provide a mix of roles that represent both "Direct Matches" and "Career Growth Opportunities."
- Deduplication: Ensure no redundant roles from the same company are over-represented (max 2 per company).
- Return a maximum of 15 recommendations, ranked by match score.

Required Output Format (Strict JSON):

{
  "recommendations": [
    {
      "job_id": "string",
      "match_score": 0.00-1.00,
      "matching_logic": {
        "primary_reason": "Short explanation of why this fits the user's career path.",
        "skill_overlap": ["list of matching or related skills"],
        "growth_potential": "Why this role represents a step up or a stable pivot."
      }
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside the JSON structure.`;

    const userPrompt = `User Profile Data:
${profileContext}

Job API Raw Data:
${JSON.stringify(jobs, null, 2)}

Analyze these jobs and return the best matches according to the semantic matching criteria.`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    console.log("[Job Matching] OpenAI response received");

    let recommendations = [];
    try {
      const parsed = JSON.parse(content);
      recommendations = parsed.recommendations || [];
      
      // Validate and filter recommendations
      recommendations = recommendations.filter(rec => 
        rec.job_id && 
        typeof rec.match_score === 'number' && 
        rec.match_score > 0.75 &&
        rec.matching_logic
      );

      // Apply deduplication logic - max 2 jobs per company
      recommendations = deduplicateByCompany(recommendations, jobs);

      // Sort by match score descending
      recommendations.sort((a, b) => b.match_score - a.match_score);

      // Limit to top 15
      recommendations = recommendations.slice(0, 15);

      console.log("[Job Matching] Returning", recommendations.length, "matched jobs");

    } catch (e) {
      console.error("[Job Matching] Failed to parse OpenAI response:", e);
      return NextResponse.json(
        { error: "Failed to parse matching results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recommendations,
      metadata: {
        total_analyzed: jobs.length,
        total_matched: recommendations.length,
        threshold: 0.75,
      },
    });
  } catch (err) {
    console.error("[Job Matching] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Build comprehensive user profile context for semantic analysis
 */
function buildProfileContext(profile) {
  let context = "";

  // Target position and career goals
  if (profile.targetPosition) {
    context += `Target Position: ${profile.targetPosition}\n`;
  }

  // Professional summary
  if (profile.summary) {
    context += `\nProfessional Summary:\n${profile.summary}\n`;
  }

  // Experience - calculate seniority level
  if (Array.isArray(profile.experience) && profile.experience.length > 0) {
    context += `\nWork Experience (${profile.experience.length} positions):\n`;
    profile.experience.forEach((exp, idx) => {
      context += `${idx + 1}. ${exp.position || "Position"} at ${exp.company || "Company"}`;
      if (exp.startDate || exp.endDate) {
        context += ` (${exp.startDate || "?"} - ${exp.endDate || "Present"})`;
      }
      if (exp.description) {
        context += `\n   ${exp.description}`;
      }
      context += "\n";
    });

    // Calculate years of experience
    const yearsOfExperience = calculateYearsOfExperience(profile.experience);
    context += `\nTotal Years of Experience: ~${yearsOfExperience} years\n`;
  }

  // Education
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    context += `\nEducation:\n`;
    profile.education.forEach((edu, idx) => {
      context += `${idx + 1}. ${edu.degree || "Degree"} in ${edu.field || "Field"}`;
      if (edu.institution) {
        context += ` from ${edu.institution}`;
      }
      if (edu.gpa) {
        context += ` (GPA: ${edu.gpa})`;
      }
      context += "\n";
    });
  }

  // Skills - critical for skill ecosystem mapping
  if (profile.skills) {
    context += `\nSkills:\n${profile.skills}\n`;
  }

  // Languages
  if (profile.languages) {
    context += `\nLanguages: ${profile.languages}\n`;
  }

  // Certifications
  if (profile.certifications) {
    context += `\nCertifications:\n${profile.certifications}\n`;
  }

  // Location preferences
  if (profile.city || profile.country) {
    context += `\nLocation: ${[profile.city, profile.country].filter(Boolean).join(", ")}\n`;
  }

  return context;
}

/**
 * Calculate approximate years of experience from experience array
 */
function calculateYearsOfExperience(experiences) {
  if (!experiences || experiences.length === 0) return 0;

  let totalMonths = 0;
  const currentDate = new Date();

  experiences.forEach(exp => {
    if (exp.startDate) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : currentDate;
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, months);
      }
    }
  });

  return Math.round(totalMonths / 12);
}

/**
 * Deduplicate recommendations to max 2 per company
 */
function deduplicateByCompany(recommendations, jobs) {
  const companyCount = new Map();
  const jobIdToCompany = new Map();

  // Build job ID to company mapping
  jobs.forEach(job => {
    if (job.id && job.company) {
      jobIdToCompany.set(job.id, job.company.toLowerCase());
    }
  });

  // Filter recommendations based on company count
  return recommendations.filter(rec => {
    const company = jobIdToCompany.get(rec.job_id);
    if (!company) return true; // Keep if we can't determine company

    const count = companyCount.get(company) || 0;
    if (count < 2) {
      companyCount.set(company, count + 1);
      return true;
    }
    return false;
  });
}
