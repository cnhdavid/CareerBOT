import { NextResponse } from "next/server";

/**
 * POST /api/jobapi
 * Body: { query: string, location?: string, remote?: boolean }
 */
export async function POST(request) {
  try {
    const { query, location, remote } = await request.json();

    console.log("📥 Job API request:", { query, location, remote });

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    if (!process.env.JOB_API_KEY) {
      return NextResponse.json(
        { error: "JOB_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build search query with location and remote filters
    let searchQuery = query;
    if (location) {
      searchQuery += ` in ${location}`;
    }
    if (remote === true) {
      searchQuery += " remote";
    }

    const response = await fetch(
      "https://api.apijobs.dev/v1/job/search",
      {
        method: "POST",
        headers: {
          apikey: process.env.JOB_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: searchQuery,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ APIJobs error:", errorText);

      return NextResponse.json(
        { error: "Job API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log("✅ Job API success:", {
      count: data?.count,
    });

    /**
     * Optional: Response vereinfachen
     * (Frontend-freundlich)
     */
    const jobs = (data?.hits || []).map(job => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      remote: job.remote,
      url: job.url,
      publishedAt: job.published_at,
    }));

    return NextResponse.json({
      count: jobs.length,
      jobs,
    });
  } catch (err) {
    console.error("🔥 Job API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
