import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  const submit = async (event) => { event.preventDefault(); setError(''); const result = await login(email, password); if (result.success) navigate('/'); else setError(result.error); };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><p className="eyebrow">WELCOME BACK</p><h1>Sign in</h1><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="error">{error}</p>}<button className="button primary" type="submit">Login</button><p className="muted">Don't have an account? <Link className="text-link" to="/register">Register</Link></p></form></main>;
}
