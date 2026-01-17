import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const userId = await getCurrentUser();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { reviewData, jobTitle } = await request.json();

    if (!reviewData || !jobTitle) {
      return NextResponse.json(
        { error: "Missing required fields: reviewData, jobTitle" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(userId).select("name email");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate HTML content for PDF
    const html = generatePDFHTML(reviewData, jobTitle, user);

    // Return the HTML as a PDF-ready response
    // The client will handle PDF generation using html2pdf or similar
    return NextResponse.json({
      success: true,
      html: html,
      filename: `interview-review-${jobTitle.replace(/\s+/g, "-")}-${new Date().toISOString().split('T')[0]}.pdf`
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function generatePDFHTML(reviewData, jobTitle, user) {
  const formatDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Review - ${jobTitle}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
          line-height: 1.6;
          background: white;
        }
        .container {
          max-width: 850px;
          margin: 0 auto;
          padding: 40px 30px;
        }
        .header {
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 32px;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .header-meta {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #6b7280;
        }
        .candidate-info {
          background: #f3f4f6;
          padding: 15px 20px;
          border-radius: 6px;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .score-section {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .overall-score {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .overall-rating {
          font-size: 18px;
          margin-bottom: 20px;
          opacity: 0.95;
        }
        .score-breakdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 20px;
        }
        .score-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 6px;
          text-align: center;
        }
        .score-item-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .score-item-label {
          font-size: 12px;
          opacity: 0.9;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          font-size: 20px;
          color: #1e40af;
          margin-bottom: 15px;
          border-left: 4px solid #3b82f6;
          padding-left: 12px;
        }
        .section h3 {
          font-size: 16px;
          color: #374151;
          margin-bottom: 10px;
          margin-top: 15px;
        }
        .bullet-list {
          margin-left: 20px;
          margin-bottom: 15px;
        }
        .bullet-list li {
          margin-bottom: 8px;
          color: #4b5563;
        }
        .question-feedback {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .question-number {
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 8px;
        }
        .question-text {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .answer-summary {
          background: white;
          padding: 10px 15px;
          border-left: 3px solid #3b82f6;
          margin: 10px 0;
          font-size: 14px;
          color: #4b5563;
        }
        .question-score {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 5px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .feedback-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 10px;
        }
        .feedback-item {
          font-size: 13px;
        }
        .feedback-item h4 {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .tag {
          background: #e0e7ff;
          color: #3730a3;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .page-break {
          page-break-after: always;
          margin: 40px 0;
        }
        @media print {
          body {
            padding: 0;
          }
          .container {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>Interview Review</h1>
          <div class="header-meta">
            <span>Position: ${jobTitle}</span>
            <span>Date: ${formatDate}</span>
          </div>
        </div>

        <!-- Candidate Info -->
        <div class="candidate-info">
          <strong>Candidate:</strong> ${user.name} (${user.email})
        </div>

        <!-- Overall Score Section -->
        <div class="score-section">
          <div class="overall-rating">Overall Assessment: ${reviewData.overall_rating}</div>
          <div class="overall-score">${reviewData.overall_score}/100</div>
          <div class="score-breakdown">
            <div class="score-item">
              <div class="score-item-value">${reviewData.score_breakdown.communication}</div>
              <div class="score-item-label">Communication</div>
            </div>
            <div class="score-item">
              <div class="score-item-value">${reviewData.score_breakdown.role_knowledge}</div>
              <div class="score-item-label">Role Knowledge</div>
            </div>
            <div class="score-item">
              <div class="score-item-value">${reviewData.score_breakdown.structure}</div>
              <div class="score-item-label">Structure</div>
            </div>
            <div class="score-item">
              <div class="score-item-value">${reviewData.score_breakdown.impact}</div>
              <div class="score-item-label">Impact</div>
            </div>
          </div>
        </div>

        <!-- Strengths Section -->
        <div class="section">
          <h2>Key Strengths</h2>
          <ul class="bullet-list">
            ${reviewData.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <!-- Areas for Improvement -->
        <div class="section">
          <h2>Areas for Improvement</h2>
          <ul class="bullet-list">
            ${reviewData.improvements.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>

        <!-- Next Steps -->
        <div class="section">
          <h2>Next Steps & Action Items</h2>
          <ul class="bullet-list">
            ${reviewData.next_steps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>

        <!-- Page Break before detailed feedback -->
        <div class="page-break"></div>

        <!-- Detailed Question Feedback -->
        <div class="section">
          <h2>Detailed Question Feedback</h2>
          ${reviewData.question_feedback.map((q, idx) => `
            <div class="question-feedback">
              <div class="question-number">Question ${idx + 1}</div>
              <div class="question-text">${q.question}</div>
              <div class="question-score">${q.score}/100</div>
              
              <div class="answer-summary">
                <strong>Your Answer:</strong> ${q.answer_summary}
              </div>

              <div class="feedback-column">
                <div class="feedback-item">
                  <h4>✓ What You Did Well</h4>
                  <ul class="bullet-list" style="margin-left: 10px;">
                    ${q.what_you_did_well.map(w => `<li>${w}</li>`).join('')}
                  </ul>
                </div>
                <div class="feedback-item">
                  <h4>→ Areas to Improve</h4>
                  <ul class="bullet-list" style="margin-left: 10px;">
                    ${q.what_to_improve.map(w => `<li>${w}</li>`).join('')}
                  </ul>
                </div>
              </div>

              <div class="feedback-item" style="margin-top: 10px;">
                <h4>Missing Signals</h4>
                <ul class="bullet-list" style="margin-left: 10px;">
                  ${q.missing_signal.map(m => `<li>${m}</li>`).join('')}
                </ul>
              </div>

              <div class="feedback-item" style="margin-top: 10px;">
                <h4>Example of a Stronger Answer</h4>
                <p style="font-style: italic; color: #4b5563; padding: 10px 0;">"${q.suggested_better_answer}"</p>
              </div>

              <div class="tags">
                ${q.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </body>
    </html>
  `;
}
