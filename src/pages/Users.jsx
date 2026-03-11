import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiShield } from 'react-icons/fi';

const emptyUser = {
  user_id: '', username: '', password: '', designation: '',
  access_right: 'USER', is_admin: false,
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyUser });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 403) toast.error('Admin access required');
      else toast.error('Failed to load users');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleNew = () => { setForm({ ...emptyUser }); setEditing(false); setShowModal(true); };

  const handleEdit = (user) => {
    setForm({ ...user, password: '' });
    setEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (user.user_id === 'ADMIN') return toast.error('Cannot delete default admin');
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.username) return toast.error('User ID and Username are required');
    if (!editing && !form.password) return toast.error('Password is required for new users');
    setLoading(true);
    try {
      const data = { ...form };
      if (editing && !data.password) delete data.password;
      if (editing) {
        await api.put(`/users/${form.id}`, data);
        toast.success('User updated');
      } else {
        await api.post('/users', data);
        toast.success('User added');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); } finally { setLoading(false); }
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">System Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage user accounts and access rights</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}><FiPlus size={16} /> Add User</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>UserID</th>
                <th>UserName</th>
                <th>Designation</th>
                <th>Access Right</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td className="font-mono font-medium">{u.user_id}</td>
                  <td>{u.username}</td>
                  <td>{u.designation}</td>
                  <td><span className="badge badge-active">{u.access_right}</span></td>
                  <td>
                    {u.is_admin ? (
                      <FiShield className="text-amber-500" size={18} />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-warning text-xs py-1 px-2" onClick={() => handleEdit(u)}>
                        <FiEdit2 size={14} /> Edit
                      </button>
                      {u.user_id !== 'ADMIN' && (
                        <button className="btn btn-danger text-xs py-1 px-2" onClick={() => handleDelete(u)}>
                          <FiTrash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">User ID *</label>
                  <input className="form-input" value={form.user_id} onChange={(e) => handleChange('user_id', e.target.value)}
                    required disabled={editing} />
                </div>
                <div>
                  <label className="form-label">Username *</label>
                  <input className="form-input" value={form.username} onChange={(e) => handleChange('username', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input type="password" className="form-input" value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)} required={!editing} />
                </div>
                <div>
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Access Right</label>
                  <select className="form-input" value={form.access_right} onChange={(e) => handleChange('access_right', e.target.value)}>
                    <option>USER</option>
                    <option>ADMINISTRATOR</option>
                    <option>LIBRARIAN</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 pb-2">
                    <input type="checkbox" checked={form.is_admin} onChange={(e) => handleChange('is_admin', e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">Admin Privileges</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (editing ? 'Update' : 'Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
