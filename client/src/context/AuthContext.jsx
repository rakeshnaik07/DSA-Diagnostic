import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL, apiFetch } from '../config';

const AuthContext = createContext(null);

async function responseError(response) {
  const data = await response.json().catch(() => ({}));
  return data.error || 'Authentication request failed';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/auth/me`)
      .then(async (response) => { if (response.ok) setUser((await response.json()).user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (path, email, password) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/auth/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return { success: false, error: await responseError(response) };
      setUser((await response.json()).user);
      return { success: true };
    } catch (error) { return { success: false, error: error.message || 'Could not connect to the server' }; }
  };

  const login = (email, password) => authenticate('login', email, password);
  const register = (email, password) => authenticate('register', email, password);
  const logout = async () => { await apiFetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {}); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
