import { useEffect, useState } from 'react';
import { API_BASE_URL, apiFetch } from '../../config';

export default function AdminUsers() {
  const [users, setUsers] = useState([]); const [error, setError] = useState(null);
  useEffect(() => { apiFetch(`${API_BASE_URL}/api/admin/users`).then(async (response) => { if (!response.ok) throw new Error(); setUsers(await response.json()); }).catch(() => setError('Could not load users.')); }, []);
  return <main className="page admin-page"><section className="page-intro"><div><p className="eyebrow">ADMINISTRATION</p><h1>Users</h1><p className="lede">Read-only account overview.</p></div></section>{error && <p className="error admin-error">{error}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Role</th><th>Created</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.email}</td><td>{user.role}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></main>;
}
