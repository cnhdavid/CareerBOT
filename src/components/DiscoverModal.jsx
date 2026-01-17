import { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";

export default function DiscoverModal({ onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Generate suggestions and initialize with user profile data
  useEffect(() => {
    if (user) {
      if (user.targetPosition) {
        setQuery(user.targetPosition);
      }
      if (user.city || user.country) {
        const locationStr = [user.city, user.country].filter(Boolean).join(", ");
        setLocation(locationStr);
      }

      // Generate AI-powered job filter suggestions
      generateSuggestions();
    }
  }, [user]);

  const generateSuggestions = async () => {
    if (!user || (!user.education && !user.skills)) return;

    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/generate-job-filters", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          education: user.education || [],
          skills: user.skills || "",
          targetPosition: user.targetPosition || "",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error("Error generating suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion) => {
    setQuery(suggestion);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/jobApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          location: location.trim() || undefined,
          remote: remote || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "Error fetching jobs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rooms-modal">
      <div className="modal-header">
        <h2>{t('sidebar.discover', { defaultValue: 'Discover' })}</h2>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-content">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
          {/* Search Query */}
          <input
            type="text"
            placeholder="Job title or position..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{
              padding: "0.5rem 0.625rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--input)",
              color: "var(--text)",
              fontSize: "0.875rem",
            }}
          />

          {/* Location */}
          <input
            type="text"
            placeholder="Location (e.g., Berlin, Germany)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              padding: "0.5rem 0.625rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--input)",
              color: "var(--text)",
              fontSize: "0.875rem",
            }}
          />

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <p style={{ fontSize: "0.75rem", opacity: 0.7, marginBottom: "0.5rem", fontWeight: 500 }}>
                {loadingSuggestions ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                    Generating suggestions...
                  </span>
                ) : (
                  "Based on your profile:"
                )}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => applySuggestion(suggestion)}
                    style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid var(--border)",
                      background: "var(--input)",
                      color: "var(--text)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "var(--button-bg)";
                      e.target.style.borderColor = "var(--button-border)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "var(--input)";
                      e.target.style.borderColor = "var(--border)";
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remote Checkbox and Search Button */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}>
              <input
                type="checkbox"
                checked={remote}
                onChange={(e) => setRemote(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              Remote only
            </label>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              style={{
                marginLeft: "auto",
                background: "var(--button-bg)",
                color: "var(--text)",
                border: "1px solid var(--button-border)",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                opacity: loading || !query.trim() ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        {jobs.length > 0 && (
          <div>
            <p style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "0.75rem" }}>
              Found {jobs.length} job{jobs.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "60vh", overflowY: "auto" }}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    background: "var(--input)",
                  }}
                >
                  <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", fontWeight: 600 }}>
                    {job.title}
                  </h3>
                  <p style={{ margin: "0.125rem 0", fontSize: "0.8rem", opacity: 0.8 }}>
                    {job.company}
                  </p>
                  <p style={{ margin: "0.125rem 0", fontSize: "0.8rem", opacity: 0.7 }}>
                    {job.location} {job.remote && "• Remote"}
                  </p>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "0.5rem",
                      fontSize: "0.8rem",
                      color: "#667eea",
                      textDecoration: "none",
                    }}
                  >
                    View Job →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && jobs.length === 0 && !error && query && (
          <p style={{ textAlign: "center", opacity: 0.6, fontSize: "0.875rem" }}>
            No jobs found for "{query}"
          </p>
        )}
      </div>
    </div>
  );
}
