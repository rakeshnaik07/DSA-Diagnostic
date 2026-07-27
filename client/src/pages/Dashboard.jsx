import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, apiFetch } from '../config';

function Dashboard() {
  const [problems, setProblems] = useState([]); const [count, setCount] = useState({ total: 0 }); const [solved, setSolved] = useState(0); const [error, setError] = useState(null);
  useEffect(() => {
    Promise.all([
      apiFetch(`${API_BASE_URL}/api/problems`).then((r) => r.json()), apiFetch(`${API_BASE_URL}/api/sessions/count`).then((r) => r.json()), apiFetch(`${API_BASE_URL}/api/sessions/solved`).then((r) => r.json()),
    ]).then(([problemData, countData, solvedSessions]) => { setProblems(problemData); setCount(countData); setSolved(new Set(solvedSessions.map((s) => String(s.problemId?._id || s.problemId))).size); }).catch(() => setError('Could not load your practice summary.'));
  }, []);
  return <main className="page dashboard-page">
    <section className="welcome"><div><p className="eyebrow">PERSONAL PRACTICE INTELLIGENCE</p><h1>Your practice, decoded.</h1><p className="lede">Solve problems, notice the friction, and turn every attempt into a clearer next step.</p></div><div className="welcome-mark">↗<small>keep going</small></div></section>
    {error && <p className="error">{error}</p>}
    <section className="stats-grid"><div className="stat-card"><span>Problems solved</span><strong>{solved}</strong><small>unique problems</small></div><div className="stat-card"><span>Sessions recorded</span><strong>{count.total}</strong><small>behavioral records</small></div></section>
    <section className="section-heading"><div><p className="eyebrow">NEXT UP</p><h2>Continue practicing</h2></div><Link className="text-link" to="/problems">View all problems →</Link></section>
    <section className="problem-cards">{problems.slice(0, 3).map((p) => <Link className="problem-card" key={p._id} to={`/solve/${p._id}`}><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><h3>{p.title}</h3><span className="muted">{p.category}</span><span className="card-arrow">→</span></Link>)}</section>
    <section className="section-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>Explore the signal</h2></div></section>
    <section className="quick-nav"><Link to="/problems"><span className="nav-icon">01</span><div><h3>Problem library</h3><p>Choose your next challenge from the full catalog.</p></div><b>→</b></Link></section>
  </main>;
}
export default Dashboard;
