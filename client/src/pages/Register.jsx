import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, register } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  const submit = async (event) => { event.preventDefault(); setError(''); if (password !== confirm) { setError('Passwords do not match'); return; } const result = await register(email, password); if (result.success) navigate('/'); else setError(result.error); };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><p className="eyebrow">START PRACTICING</p><h1>Create account</h1><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><label>Confirm password<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>{error && <p className="error">{error}</p>}<button className="button primary" type="submit">Register</button><p className="muted">Already have an account? <Link className="text-link" to="/login">Login</Link></p></form></main>;
}
