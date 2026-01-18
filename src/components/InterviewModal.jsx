import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, RotateCcw, Download, Loader2, AlertCircle, Target, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import ScoreBreakdownChart from "./ScoreBreakdownChart";
import "./InterviewModal.css";

export default function InterviewModal({ onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [stage, setStage] = useState("start"); // "start", "loading", "interview", "review"
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [apiError, setApiError] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const targetJob = user?.targetPosition || null;

  // Fetch questions from API when starting interview
  const fetchInterviewQuestions = async () => {
    if (!targetJob) return;
    
    setLoadingQuestions(true);
    setApiError("");
    
    try {
      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate questions";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Ensure we have valid data
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response format from server");
      }

      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(""));
      setCurrentQuestion(0);
      setCurrentAnswer("");
      setError("");
      setStage("interview");
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setApiError(err.message || "Failed to generate interview questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const generateReview = async (answersToSubmit) => {
    setLoadingReview(true);
    setApiError("");
    
    try {
      const response = await fetch("/api/interview/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: targetJob,
          questions: questions.map(q => ({ id: q.id, question: q.question })),
          answers: answersToSubmit || answers
        })
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate review";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setReview(data);
      setStage("review");
      
      // Initialize expanded state for questions
      const initialExpanded = {};
      if (data.question_feedback) {
        data.question_feedback.forEach((_, idx) => {
          initialExpanded[idx] = false;
        });
      }
      setExpandedQuestions(initialExpanded);
    } catch (err) {
      console.error("Failed to generate review:", err);
      setApiError(err.message || "Failed to generate review");
    } finally {
      setLoadingReview(false);
    }
  };

  const handleStartInterview = () => {
    if (!targetJob) return;
    setStage("loading");
    fetchInterviewQuestions();
  };

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) {
      setError("Please provide an answer before moving to the next question.");
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = currentAnswer;

    if (currentQuestion < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer(newAnswers[currentQuestion + 1] || "");
      setError("");
    } else {
      // Last question answered, generate review with the updated answers
      setAnswers(newAnswers);
      generateReview(newAnswers);
    }
  };

  const handleBackQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = currentAnswer;
    setAnswers(newAnswers);

    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setCurrentAnswer(answers[currentQuestion - 1] || "");
      setError("");
    }
  };

  const handleRestartInterview = () => {
    setStage("start");
    setCurrentQuestion(0);
    setQuestions([]);
    setAnswers([]);
    setCurrentAnswer("");
    setError("");
    setReview(null);
    setApiError("");
  };

  const handleRetryInterview = () => {
    setStage("loading");
    setReview(null);
    setError("");
    setApiError("");
    fetchInterviewQuestions();
  };

  const toggleQuestionExpanded = (idx) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleExportPDF = async () => {
    if (!review) return;
    
    setExportingPDF(true);
    setApiError("");
    
    try {
      const response = await fetch("/api/interview/review/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          reviewData: review,
          jobTitle: targetJob
        })
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate PDF";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { html, filename } = data;

      // Use html2pdf to generate PDF from HTML
      if (typeof window !== "undefined" && window.html2pdf) {
        const element = document.createElement("div");
        element.innerHTML = html;
        
        const opt = {
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, logging: false },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        window.html2pdf().set(opt).from(element).save();
      } else {
        // Fallback: open in new window for print-to-pdf
        const newWindow = window.open("", "_blank");
        newWindow.document.write(html);
        newWindow.document.close();
        setTimeout(() => {
          newWindow.print();
        }, 250);
      }
    } catch (err) {
      console.error("Failed to export PDF:", err);
      setApiError(err.message || "Failed to export PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportAnswers = () => {
    const text = questions
      .map(
        (q, i) =>
          `Question ${i + 1}: ${q.question}\n\nAnswer: ${answers[i] || "Not answered"}\n\n---\n\n`
      )
      .join("");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute(
      "download",
      `interview-${targetJob}-${new Date().toISOString().split("T")[0]}.txt`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="interview-modal">
      {stage === "start" && (
        <div className="interview-start">
          <div className="interview-header">
            <h2>{t("interview.title", { defaultValue: "Simulated Interview" })}</h2>
            <p>
              {t("interview.subtitle", {
                defaultValue: "AI-powered practice interview tailored to your target role",
              })}
            </p>
          </div>

          {!targetJob ? (
            <div className="interview-empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>
                {t("interview.noJob", {
                  defaultValue: "No Target Job Found",
                })}
              </h3>
              <p>
                {t("interview.noJobMessage", {
                  defaultValue:
                    "To start a simulated interview, you need to save a target job position in your profile.",
                })}
              </p>
              <button className="btn-primary" onClick={onClose}>
                {t("interview.goToProfile", { defaultValue: "Go to Profile" })}
              </button>
              <button className="btn-secondary" onClick={onClose}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </button>
            </div>
          ) : (
            <div className="interview-start-content">
              <div className="job-info">
                <p className="job-label">
                  {t("interview.interviewFor", { defaultValue: "Interview for:" })}
                </p>
                <h3 className="job-title">{targetJob}</h3>
              </div>

              <div className="interview-info">
                <p>
                  {t("interview.questionsInfo", {
                    defaultValue:
                      "You'll be asked 7 tailored questions based on your target position. Take your time to provide thoughtful answers.",
                  })}
                </p>
              </div>

              <div className="interview-actions">
                <button
                  className="btn-primary"
                  onClick={handleStartInterview}
                >
                  {t("interview.start", { defaultValue: "Start Interview" })}
                </button>
                <button className="btn-secondary" onClick={onClose}>
                  {t("common.cancel", { defaultValue: "Cancel" })}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === "loading" && (
        <div className="interview-loading">
          <div className="interview-header">
            <h2>{t("interview.title", { defaultValue: "Simulated Interview" })}</h2>
          </div>
          
          <div className="loading-container">
            <Loader2 size={48} className="spinner" />
            <p className="loading-text">
              {t("interview.generatingQuestions", {
                defaultValue: "AI is preparing your personalized interview questions...",
              })}
            </p>
          </div>
        </div>
      )}

      {stage === "interview" && questions.length > 0 && (
        <div className="interview-flow">
          <div className="interview-header">
            <h2>
              {t("interview.title", { defaultValue: "Simulated Interview" })}
            </h2>
            <p className="progress">
              {t("interview.progress", {
                defaultValue: `Question {{current}} of {{total}}`,
                current: currentQuestion + 1,
                total: questions.length,
              })}
            </p>
          </div>

          {apiError && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{apiError}</span>
            </div>
          )}

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>

          <div className="question-container">
            <div className="question-text">
              <p>
                <strong>Q{currentQuestion + 1}:</strong>{" "}
                {questions[currentQuestion]?.question || questions[currentQuestion]}
              </p>
            </div>

            <textarea
              className="answer-input"
              placeholder={t("interview.answerPlaceholder", {
                defaultValue: "Type your answer here...",
              })}
              value={currentAnswer}
              onChange={(e) => {
                setCurrentAnswer(e.target.value);
                if (e.target.value.trim()) {
                  setError("");
                }
              }}
            />

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="interview-controls">
            <button
              className="btn-secondary"
              onClick={handleBackQuestion}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft size={18} />
              {t("common.back", { defaultValue: "Back" })}
            </button>

            <button
              className="btn-primary"
              onClick={handleNextQuestion}
            >
              {currentQuestion === questions.length - 1
                ? t("interview.finish", { defaultValue: "Finish" })
                : t("common.next", { defaultValue: "Next" })}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {loadingReview && (
        <div className="interview-loading">
          <div className="loading-container">
            <Loader2 size={48} className="spinner" />
            <h2>Analyzing Your Interview</h2>
            <p>Our AI is reviewing your responses and generating personalized feedback...</p>
          </div>
        </div>
      )}

      {stage === "review" && review && (
        <div className="interview-review">
          <div className="interview-header">
            <h2>
              {t("interview.reviewTitle", { defaultValue: "Interview Review" })}
            </h2>
            <p>
              {t("interview.reviewSubtitle", {
                defaultValue: "Your personalized feedback from the AI interviewer",
              })}
            </p>
          </div>

          {apiError && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{apiError}</span>
            </div>
          )}

          <div className="review-content">
            {/* Header with overall rating and score */}
            <div className="review-header-section">
              <div className="job-info">
                <p className="job-label">
                  {t("interview.interviewFor", { defaultValue: "Interview for:" })}
                </p>
                <h3 className="job-title">{review.job_title}</h3>
              </div>

              <div className="overall-score-card">
                <div className="score-display">
                  <div className="score-number">{review.overall_score}</div>
                  <div className="score-label">Overall Score</div>
                </div>
                <span className={`rating-badge rating-${review.overall_rating.toLowerCase().replace(' ', '-')}`}>
                  {review.overall_rating}
                </span>
              </div>
            </div>

            {/* Score Breakdown Chart */}
            {review.score_breakdown && (
              <section className="review-section">
                <h3 className="section-title">Score Breakdown</h3>
                <ScoreBreakdownChart data={review.score_breakdown} />
              </section>
            )}

            {/* Overall Strengths */}
            {review.strengths && review.strengths.length > 0 && (
              <section className="review-section">
                <h3 className="section-title">💪 Strengths</h3>
                <ul className="bullet-list">
                  {review.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Overall Improvements */}
            {review.improvements && review.improvements.length > 0 && (
              <section className="review-section">
                <h3 className="section-title">📈 Areas for Improvement</h3>
                <ul className="bullet-list">
                  {review.improvements.map((improvement, idx) => (
                    <li key={idx}>{improvement}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Per-Question Feedback */}
            {review.question_feedback && review.question_feedback.length > 0 && (
              <section className="review-section">
                <h3 className="section-title">Per-Question Feedback</h3>
                <div className="questions-feedback-list">
                  {review.question_feedback.map((qf, idx) => (
                    <div key={idx} className="question-feedback-card">
                      <div 
                        className="question-feedback-header"
                        onClick={() => toggleQuestionExpanded(idx)}
                      >
                        <div className="question-info">
                          <div className="question-number">Q{idx + 1}</div>
                          <div className="question-details">
                            <p className="question-title">{qf.question}</p>
                            <div className="question-meta">
                              <span className={`score-badge score-${getScoreCategory(qf.score)}`}>
                                Score: {qf.score}
                              </span>
                              {qf.tags && qf.tags.length > 0 && (
                                <div className="question-tags">
                                  {qf.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="tag-badge">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="expand-icon">
                          {expandedQuestions[idx] ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                      </div>

                      {expandedQuestions[idx] && (
                        <div className="question-feedback-content">
                          {qf.answer_summary && (
                            <div className="answer-summary">
                              <h4>Your Response</h4>
                              <p>{qf.answer_summary}</p>
                            </div>
                          )}

                          {qf.what_you_did_well && qf.what_you_did_well.length > 0 && (
                            <div className="feedback-section">
                              <h4>✓ What You Did Well</h4>
                              <ul>
                                {qf.what_you_did_well.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {qf.what_to_improve && qf.what_to_improve.length > 0 && (
                            <div className="feedback-section">
                              <h4>→ What to Improve</h4>
                              <ul>
                                {qf.what_to_improve.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {qf.missing_signal && qf.missing_signal.length > 0 && (
                            <div className="feedback-section">
                              <h4>⚠️ Missing Signals</h4>
                              <ul>
                                {qf.missing_signal.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {qf.suggested_better_answer && (
                            <div className="suggested-answer">
                              <h4>💡 Suggested Better Response</h4>
                              <p>{qf.suggested_better_answer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Next Steps */}
            {review.next_steps && review.next_steps.length > 0 && (
              <section className="review-section">
                <h3 className="section-title"><Target size={20} style={{display: 'inline', marginRight: '8px'}} /> Next Steps to Practice</h3>
                <ol className="ordered-list">
                  {review.next_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <div className="review-actions">
            <button
              className="btn-primary"
              onClick={handleRetryInterview}
              disabled={loadingQuestions}
            >
              <RotateCcw size={18} />
              {t("interview.retry", { defaultValue: "Practice Again" })}
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleExportPDF}
              disabled={exportingPDF}
            >
              <Download size={18} />
              {exportingPDF ? "Exporting..." : "Export as PDF"}
            </button>
            <button className="btn-outline" onClick={onClose}>
              {t("common.close", { defaultValue: "Close" })}
            </button>
          </div>
        </div>
      )}

      {stage === "summary" && (
        <div className="interview-summary">
          <div className="interview-header">
            <h2>
              {t("interview.summary", { defaultValue: "Interview Summary" })}
            </h2>
            <p>
              {t("interview.summarySubtitle", {
                defaultValue: "Here are your responses",
              })}
            </p>
          </div>

          <div className="summary-content">
            <div className="job-info">
              <p className="job-label">
                {t("interview.interviewFor", { defaultValue: "Interview for:" })}
              </p>
              <h3 className="job-title">{targetJob}</h3>
            </div>

            <div className="answers-list">
              {questions.map((question, index) => (
                <div key={index} className="answer-block">
                  <div className="q-number">Q{index + 1}</div>
                  <div className="q-content">
                    <p className="question-text">
                      <strong>{question.question || question}</strong>
                    </p>
                    <p className="answer-text">
                      {answers[index] || "Not answered"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-actions">
            <button className="btn-primary" onClick={handleRestartInterview}>
              <RotateCcw size={18} />
              {t("interview.restart", { defaultValue: "Restart Interview" })}
            </button>
            <button className="btn-secondary" onClick={handleExportAnswers}>
              <Download size={18} />
              {t("interview.export", { defaultValue: "Export Answers" })}
            </button>
            <button className="btn-outline" onClick={onClose}>
              {t("common.close", { defaultValue: "Close" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to determine score category
function getScoreCategory(score) {
  if (score >= 80) return "strong";
  if (score >= 60) return "mixed";
  return "needs-work";
}
