import { BrowserRouter, Link, NavLink, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProblemList from './pages/ProblemList';
import SolveProblem from './pages/SolveProblem';

function App() {
  return (
    <BrowserRouter>
      <header className="topbar"><Link className="brand" to="/">DSA<span>diagnostic</span></Link><nav><NavLink to="/" end>Overview</NavLink><NavLink to="/problems">Problems</NavLink></nav></header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/solve/:id" element={<SolveProblem />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
