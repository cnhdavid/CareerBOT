import { useState } from "react";

/**
 * SemanticJobMatcher Component
 * 
 * Integrates with the /api/match-jobs endpoint to provide
 * intelligent job recommendations based on semantic analysis
 */
export default function SemanticJobMatcher({ user, jobs }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const matchJobs = async () => {
    if (!user || !jobs || jobs.length === 0) {
      setError("User profile and jobs are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/match-jobs", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userProfile: {
            targetPosition: user.targetPosition,
            summary: user.summary,
            experience: user.experience,
            education: user.education,
            skills: user.skills,
            languages: user.languages,
            certifications: user.certifications,
            city: user.city,
            country: user.country,
          },
          jobs: jobs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to match jobs");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setMetadata(data.metadata);
    } catch (err) {
      console.error("Job matching error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 0.9) return "text-green-600 bg-green-50";
    if (score >= 0.8) return "text-blue-600 bg-blue-50";
    return "text-purple-600 bg-purple-50";
  };

  const getMatchLabel = (score) => {
    if (score >= 0.9) return "Excellent Match";
    if (score >= 0.8) return "Great Match";
    return "Good Match";
  };

  return (
    <div className="space-y-4">
      {/* Match Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Semantic Job Matching</h3>
          <p className="text-sm text-gray-600">
            AI-powered matching based on your profile and career trajectory
          </p>
        </div>
        <button
          onClick={matchJobs}
          disabled={loading || !jobs || jobs.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Analyzing..." : "Find Best Matches"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              <strong>{metadata.total_analyzed}</strong> jobs analyzed
            </span>
            <span>•</span>
            <span>
              <strong>{metadata.total_matched}</strong> matches found
            </span>
            <span>•</span>
            <span>
              Threshold: <strong>{(metadata.threshold * 100).toFixed(0)}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">
            Your Top Matches ({recommendations.length})
          </h4>
          
          {recommendations.map((rec, index) => {
            const job = jobs.find((j) => j.id === rec.job_id);
            if (!job) return null;

            return (
              <div
                key={rec.job_id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                {/* Job Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <h5 className="text-lg font-semibold text-gray-900">
                        {job.title}
                      </h5>
                    </div>
                    <p className="text-sm text-gray-600">
                      {job.company} • {job.location}
                      {job.remote && " • Remote"}
                    </p>
                  </div>
                  
                  {/* Match Score Badge */}
                  <div className={`px-3 py-1 rounded-full ${getMatchColor(rec.match_score)}`}>
                    <div className="text-xs font-semibold">
                      {(rec.match_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs">
                      {getMatchLabel(rec.match_score)}
                    </div>
                  </div>
                </div>

                {/* Matching Logic */}
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  {/* Primary Reason */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Why this matches:
                    </p>
                    <p className="text-sm text-gray-600">
                      {rec.matching_logic.primary_reason}
                    </p>
                  </div>

                  {/* Skill Overlap */}
                  {rec.matching_logic.skill_overlap && 
                   rec.matching_logic.skill_overlap.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Matching Skills:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rec.matching_logic.skill_overlap.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Growth Potential */}
                  {rec.matching_logic.growth_potential && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Growth Opportunity:
                      </p>
                      <p className="text-sm text-gray-600">
                        {rec.matching_logic.growth_potential}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-3 flex gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    View Job
                  </a>
                  <button
                    onClick={() => {
                      // Add to saved jobs logic here
                      console.log("Save job:", job.id);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.length === 0 && metadata && (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            No jobs matched your profile above the 75% threshold.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search criteria or updating your profile.
          </p>
        </div>
      )}
    </div>
  );
}
