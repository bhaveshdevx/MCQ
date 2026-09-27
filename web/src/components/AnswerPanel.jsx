/**
 * AnswerPanel – displays the MCQ result with animated options
 */
export default function AnswerPanel({ result, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="answer-card card">
        <div className="loading-card">
          <div className="spinner-ring" />
          <h3>Analyzing Question</h3>
          <p>
            AI is reading your image
            <span className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="answer-card card">
        <div className="answer-empty" style={{ paddingBottom: 0 }}>
          <div className="empty-icon">⚠️</div>
          <h3>Analysis Failed</h3>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <div className="error-box">
            <span className="err-icon">❌</span>
            <div>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="answer-card card">
        <div className="answer-empty">
          <div className="empty-icon">🎯</div>
          <h3>Ready to Solve</h3>
          <p>
            Point your camera at any MCQ question or upload an image. The AI
            will instantly identify the correct answer.
          </p>
        </div>
      </div>
    );
  }

  const correctLabel = result.correctAnswer;
  const confidence = result.confidence ?? 92;

  return (
    <div className="answer-card card">
      <div className="answer-inner">
        <div className="card-header" style={{ padding: 0, marginBottom: 16 }}>
          <div className="card-title">
            <span>✅</span> Answer
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--accent-green)',
              fontWeight: 600,
              background: 'rgba(34,217,146,0.1)',
              border: '1px solid rgba(34,217,146,0.25)',
              borderRadius: 'var(--radius-full)',
              padding: '3px 10px',
            }}
          >
            Solved
          </div>
        </div>

        <p className="question-text">{result.question}</p>

        <div className="options-grid">
          {result.options?.map((opt) => {
            const isCorrect = opt.label === correctLabel;
            return (
              <div
                key={opt.label}
                className={`option-card ${isCorrect ? 'correct' : 'wrong'}`}
                id={`option-${opt.label}`}
              >
                <div className="option-label">{opt.label}</div>
                <div className="option-text">{opt.text}</div>
                {isCorrect && <span className="option-check">✅</span>}
              </div>
            );
          })}
        </div>

        {/* Confidence bar */}
        <div className="confidence-row">
          <span className="confidence-label">AI Confidence</span>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${confidence}%` }} />
          </div>
          <span className="confidence-pct">{confidence}%</span>
        </div>

        <div className="divider" />

        {/* Explanation */}
        <div className="explanation-box">
          <div className="ex-label">💡 Explanation</div>
          <p>{result.reason}</p>
        </div>
      </div>
    </div>
  );
}
