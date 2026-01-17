import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, RotateCcw, Download } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { generateInterviewQuestions } from "@/lib/generateInterviewQuestions";
import "./InterviewModal.css";

export default function InterviewModal({ onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [stage, setStage] = useState("start"); // "start", "interview", "summary"
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState("");

  const targetJob = user?.targetPosition || null;

  // Initialize interview
  useEffect(() => {
    if (stage === "start" && targetJob) {
      const generatedQuestions = generateInterviewQuestions(targetJob);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(""));
      setCurrentAnswer("");
      setError("");
    }
  }, [stage, targetJob]);

  const handleStartInterview = () => {
    if (!targetJob) return;
    setStage("interview");
    setCurrentQuestion(0);
    setCurrentAnswer("");
    setError("");
  };

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) {
      setError("Please provide an answer before moving to the next question.");
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = currentAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer(answers[currentQuestion + 1] || "");
      setError("");
    } else {
      // Last question answered, go to summary
      setStage("summary");
      setCurrentQuestion(0);
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
  };

  const handleExportAnswers = () => {
    const text = questions
      .map(
        (q, i) =>
          `Question ${i + 1}: ${q}\n\nAnswer: ${answers[i] || "Not answered"}\n\n---\n\n`
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
                defaultValue: "Practice your interview skills with AI-guided questions",
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
                {questions[currentQuestion]}
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
                      <strong>{question}</strong>
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
