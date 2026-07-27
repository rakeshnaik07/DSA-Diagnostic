import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import SessionReport from '../components/SessionReport';
import { API_BASE_URL, apiFetch } from '../config';

function CompactScore({ score }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const value = Number(score) || 0;
  const color = value <= 4 ? 'var(--color-negative)' : value <= 7 ? 'var(--color-accent)' : 'var(--color-positive)';
  return <div className="history-score" aria-label={`Overall score ${value} out of 10`}><svg viewBox="0 0 44 44" role="img"><circle className="history-score-track" cx="22" cy="22" r={radius} /><circle className="history-score-value" cx="22" cy="22" r={radius} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference * (1 - Math.max(0, Math.min(10, value)) / 10) }} /></svg><strong>{value}/10</strong></div>;
}

export default function History() {
  const [sessions, setSessions] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [selected, setSelected] = useState(null);
  useEffect(() => { apiFetch(`${API_BASE_URL}/api/sessions/history`).then(async (response) => { if (!response.ok) throw new Error('Could not load session history'); return response.json(); }).then(setSessions).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <main className="page"><p>Loading session history...</p></main>;
  if (error) return <main className="page"><p className="error">{error}</p></main>;
  const report = selected?.aiReport && { ...selected.aiReport, strengths: selected.aiReport.strengths || [], weaknesses: selected.aiReport.weaknesses || [], improvements: selected.aiReport.improvements || [] };
  return <main className="page history-page"><section className="page-intro"><div><p className="eyebrow">YOUR PRACTICE RECORD</p><h1>Session history.</h1><p className="lede">Review what each solved problem revealed about your process.</p></div></section>{sessions.length === 0 ? <div className="insufficient-report"><span className="insufficient-icon" aria-hidden="true">◦</span><h3>No solved sessions yet</h3><p>Solve a problem to see your report history here.</p></div> : <section className="history-list">{sessions.map((session) => <button className="history-row" key={session.id} onClick={() => setSelected(session)}><div><h3>{session.problemTitle}</h3><span className="muted">{new Date(session.createdAt).toLocaleDateString()}</span></div><p>{session.aiReport?.summary || 'No summary available.'}</p>{session.aiReport?.overallScore !== undefined && <CompactScore score={session.aiReport.overallScore} />}</button>)}</section>}<Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)}>{report && <SessionReport report={report} />}</Modal></main>;
}
