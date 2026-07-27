import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="page"><p>Loading...</p></main>;
  return user ? children : <Navigate to="/login" replace />;
}
