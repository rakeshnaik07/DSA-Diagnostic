function ScoreRing({ score }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.max(0, Math.min(10, score)) / 10;
  const color = score <= 4 ? 'var(--color-negative)' : score <= 7 ? 'var(--color-accent)' : 'var(--color-positive)';

  return (
    <div className="score-ring" aria-label={`Overall score ${score} out of 10`}>
      <svg viewBox="0 0 100 100" role="img">
        <circle className="score-ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="score-ring-value"
          cx="50"
          cy="50"
          r={radius}
          style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference * (1 - percentage) }}
        />
      </svg>
      <strong>{score}/10</strong>
      <span>SESSION SCORE</span>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="session-report report-skeleton" aria-label="Loading session report">
      <div className="skeleton-score" />
      <div className="skeleton-summary"><span /><span /><span /></div>
      <div className="skeleton-diff"><span /><span /><span /><span /></div>
    </div>
  );
}

function SessionReport({ report, loading, error, onGenerate: _onGenerate, onRetry }) {
  if (loading) return <ReportSkeleton />;

  if (error) {
    return (
      <div className="prediction">
        <p className="error">{error}</p>
        <button className="button primary" onClick={onRetry}>Retry</button>
      </div>
    );
  }

  if (!report) return null;

  if (report.insufficientData) {
    return (
      <div className="insufficient-report">
        <span className="insufficient-icon" aria-hidden="true">◷</span>
        <h3>Not enough activity to analyze this session</h3>
      </div>
    );
  }

  return (
    <div className="session-report">
      {report.overallScore !== null && report.overallScore !== undefined && <ScoreRing score={report.overallScore} />}
      <section className="report-summary">
        <p>{report.summary}</p>
      </section>
      <div className="report-diff" aria-label="Session annotations">
        {report.strengths.map((item, index) => (
          <div className="diff-entry diff-strength" key={`strength-${item.point}-${index}`}>
            <div><span className="diff-marker">+ </span>{item.point}</div>
            <p>  // {item.evidence}</p>
          </div>
        ))}
        {report.weaknesses.map((item, index) => (
          <div className="diff-entry diff-weakness" key={`weakness-${item.point}-${index}`}>
            <div><span className="diff-marker">- </span>{item.point} <span className={`severity-tag severity-${item.severity}`}>[{item.severity.toUpperCase()}]</span></div>
            <p>  // {item.evidence}</p>
          </div>
        ))}
        {report.improvements.map((item, index) => (
          <div className="diff-entry diff-improvement" key={`improvement-${item.action}-${index}`}>
            <div><span className="diff-marker">~ </span>{item.action}</div>
            <p>  // {item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionReport;
