export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function apiFetch(url, options = {}) {
  return fetch(url, { credentials: 'include', ...options });
}
