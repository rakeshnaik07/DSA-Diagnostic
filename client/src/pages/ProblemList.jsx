import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, apiFetch } from '../config';

function ProblemList() {
  const [problems, setProblems] = useState([]); const [solvedIds, setSolvedIds] = useState(new Set()); const [query, setQuery] = useState(''); const [difficulty, setDifficulty] = useState('All'); const [category, setCategory] = useState('All'); const [loading, setLoading] = useState(true); const [error, setError] = useState(null);
  useEffect(() => { Promise.all([apiFetch(`${API_BASE_URL}/api/problems`).then((r) => r.json()), apiFetch(`${API_BASE_URL}/api/sessions/solved`).then((r) => r.json())]).then(([ps, sessions]) => { setProblems(ps); setSolvedIds(new Set(sessions.map((s) => String(s.problemId?._id || s.problemId)))); }).catch(() => setError('Could not load the problem library.')).finally(() => setLoading(false)); }, []);
  const categories = [...new Set(problems.map((p) => p.category))].sort();
  const filtered = useMemo(() => problems.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) && (difficulty === 'All' || p.difficulty === difficulty) && (category === 'All' || p.category === category)), [problems, query, difficulty, category]);
  if (loading) return <main className="page"><p>Loading problem library...</p></main>; if (error) return <main className="page"><p className="error">{error}</p></main>;
  return <main className="page problems-page"><section className="page-intro"><div><p className="eyebrow">THE CATALOG</p><h1>Find your next edge.</h1><p className="lede">Each attempt is a data point. Pick a problem and see what your process reveals.</p></div><div className="catalog-stat"><strong>{problems.length}</strong><span>problems<br />available</span></div></section>
    <section className="list-toolbar"><input aria-label="Search problems" placeholder="Search by title..." value={query} onChange={(e) => setQuery(e.target.value)} /><div className="filter-group">{['All', 'Easy', 'Medium', 'Hard'].map((d) => <button className={difficulty === d ? 'filter active' : 'filter'} key={d} onClick={() => setDifficulty(d)}>{d}</button>)}</div><select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}><option>All</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></section>
    <div className="list-meta"><span>{filtered.length} of {problems.length} problems</span><span>{solvedIds.size} solved</span></div><section className="problem-list">{filtered.map((p) => <Link className="problem-row" key={p._id} to={`/solve/${p._id}`}><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><div><h3>{p.title}</h3><span className="muted">{p.category}</span></div>{solvedIds.has(String(p._id)) && <span className="solved">✓ Solved</span>}<b>→</b></Link>)}{filtered.length === 0 && <p className="empty">No problems match those filters.</p>}</section>
  </main>;
}
export default ProblemList;
