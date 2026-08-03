import { BrowserRouter, Link, NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProblemList from './pages/ProblemList';
import SolveProblem from './pages/SolveProblem';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminProblems from './pages/admin/AdminProblems';
import AdminUsers from './pages/admin/AdminUsers';
import { useAuth } from './context/AuthContext';

function Topbar() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const signOut = async () => { await logout(); navigate('/login'); };
  return <header className="topbar"><Link className="brand" to="/">DSA<span>diagnostic</span></Link><nav><NavLink to="/" end>Overview</NavLink><NavLink to="/problems">Problems</NavLink><NavLink to="/history">History</NavLink>{user?.role === 'admin' && <><NavLink to="/admin/problems">Admin Problems</NavLink><NavLink to="/admin/users">Admin Users</NavLink></>}{user && <><span className="nav-user">{user.email}</span><button className="nav-button" onClick={signOut}>Logout</button></>}</nav></header>;
}

function App() {
  return (
    <BrowserRouter>
      <Topbar />
      <Routes>
        <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/problems" element={<ProtectedRoute><ProblemList /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/solve/:id" element={<ProtectedRoute><SolveProblem /></ProtectedRoute>} />
        <Route path="/admin/problems" element={<AdminRoute><AdminProblems /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
