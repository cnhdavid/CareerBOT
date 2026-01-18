import { NextResponse } from "next/server";
import { filterMockJobs } from "@/lib/mockJobs";

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
      console.warn("⚠️ JOB_API_KEY not configured, using mock data for development");
      const jobs = filterMockJobs(query, location, remote);
      return NextResponse.json({
        count: jobs.length,
        jobs,
        mock: true,
      });
    }

    // Build search query with location and remote filters
    let searchQuery = query;
    if (location) {
      searchQuery += ` in ${location}`;
    }
    if (remote === true) {
      searchQuery += " remote";
    }

    console.log("🔑 Using API key:", process.env.JOB_API_KEY.substring(0, 10) + "...");
    console.log("🔍 Search query:", query, "Location:", location);

    // Jooble API: URL includes the API key as path parameter
    const joobleUrl = `https://jooble.org/api/${process.env.JOB_API_KEY}`;

    // Build Jooble request body
    const requestBody = {
      keywords: query,
      location: location || "",
    };

    const response = await fetch(joobleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ APIJobs error:", errorText);
      console.warn("⚠️ Falling back to mock data due to API error");

      const jobs = filterMockJobs(query, location, remote);
      return NextResponse.json({
        count: jobs.length,
        jobs,
        mock: true,
        error: "External API unavailable, showing sample data",
      });
    }

    const data = await response.json();

    console.log("✅ Jooble API success:", {
      totalCount: data?.totalCount,
      jobsReturned: data?.jobs?.length,
    });

    /**
     * Transform Jooble response to frontend-friendly format
     * Jooble returns: { totalCount, jobs: [...] }
     */
    const jobs = (data?.jobs || []).map((job, index) => ({
      id: job.id || `jooble-${index}-${Date.now()}`,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.type?.toLowerCase().includes('remote') || false,
      url: job.link,
      publishedAt: job.updated,
      description: job.snippet,
      salary: job.salary,
    }));

    return NextResponse.json({
      count: jobs.length,
      jobs,
    });
  } catch (err) {
    console.error("🔥 Job API error:", err);
    console.warn("⚠️ Falling back to mock data due to error");
    
    try {
      const { query, location, remote } = await request.json();
      const jobs = filterMockJobs(query, location, remote);
      return NextResponse.json({
        count: jobs.length,
        jobs,
        mock: true,
        error: "Service temporarily unavailable, showing sample data",
      });
    } catch (fallbackErr) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
