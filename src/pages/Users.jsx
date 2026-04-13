import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiPlus as FiPlus, PiPencilSimple as FiEdit2, PiX as FiX, PiShieldCheck as FiShield, PiBooks as FiBook, PiMagnifyingGlass as FiSearch, PiCheck as FiCheck, PiListBullets as FiList, PiArrowElbowDownLeft as FiCornerDownLeft } from 'react-icons/pi';

const emptyUser = {
  user_id: '', username: '', password: '', designation: '',
  access_right: 'STAFF', is_admin: false,
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyUser });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Borrow book states
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [userLoans, setUserLoans] = useState([]);

  // Return book states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnUser, setReturnUser] = useState(null);
  const [returnLoans, setReturnLoans] = useState([]);
  const [returnLoading, setReturnLoading] = useState(false);

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

  // Set default due date (3 days from now)
  useEffect(() => {
    const due = new Date();
    due.setDate(due.getDate() + 3);
    setDueDate(due.toISOString().split('T')[0]);
  }, [showBorrowModal]);

  const handleNew = () => { setForm({ ...emptyUser }); setEditing(false); setShowModal(true); };

  const handleEdit = (user) => {
    setForm({ ...user, password: '' });
    setEditing(true);
    setShowModal(true);
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

  // Borrow book handlers
  const handleBorrowClick = async (user) => {
    setSelectedUser(user);
    setSelectedBook(null);
    setBookSearch('');
    setShowBorrowModal(true);
    // Load books and user's loans
    try {
      const [booksRes, loansRes] = await Promise.all([
        api.get('/books'),
        api.get(`/users/${user.id}/loans`).catch(() => ({ data: [] }))
      ]);
      setBooks(booksRes.data);
      setUserLoans(loansRes.data);
    } catch {
      toast.error('Failed to load data');
    }
  };

  const searchBooks = async () => {
    try {
      const res = await api.get('/books', { params: { search: bookSearch || undefined } });
      setBooks(res.data);
    } catch {
      toast.error('Failed to search books');
    }
  };

  const handleBorrowSubmit = async () => {
    if (!selectedBook) return toast.error('Please select a book');
    if (!dueDate) return toast.error('Please set a due date');
    if (selectedBook.copies_available <= 0) return toast.error('No copies available');

    setBorrowLoading(true);
    try {
      await api.post('/users/borrow', {
        user_id: selectedUser.id,
        book_id: selectedBook.id,
        due_date: dueDate,
      });
      toast.success(`Book "${selectedBook.title}" checked out to ${selectedUser.username}!`);
      // Refresh loans
      const loansRes = await api.get(`/users/${selectedUser.id}/loans`).catch(() => ({ data: [] }));
      setUserLoans(loansRes.data);
      setSelectedBook(null);
      // Refresh books to update available copies
      searchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setBorrowLoading(false);
    }
  };

  const filteredBooks = books.filter(b => b.copies_available > 0 || selectedBook?.id === b.id);

  // Return book handlers
  const handleReturnClick = async (user) => {
    setReturnUser(user);
    setShowReturnModal(true);
    try {
      const loansRes = await api.get(`/users/${user.id}/loans`).catch(() => ({ data: [] }));
      setReturnLoans(loansRes.data.filter(l => ['loaned', 'overdue'].includes(l.status?.toLowerCase())));
    } catch {
      toast.error('Failed to load loans');
    }
  };

  const handleReturnBook = async (loan) => {
    if (!window.confirm(`Return "${loan.book_title}"?`)) return;
    setReturnLoading(true);
    try {
      await api.post(`/transactions/checkin/${loan.id}`, {
        return_date: new Date().toISOString().split('T')[0],
      });
      toast.success(`"${loan.book_title}" returned successfully!`);
      // Refresh loans
      const loansRes = await api.get(`/users/${returnUser.id}/loans`).catch(() => ({ data: [] }));
      setReturnLoans(loansRes.data.filter(l => ['loaned', 'overdue'].includes(l.status?.toLowerCase())));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed');
    } finally {
      setReturnLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f5f3ff] z-0" />
      
      {/* Soft floating gradient orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-blue-300/50 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />

      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight drop-shadow-sm mb-2">System Users</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">Manage Accounts & Access Rights</p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
        >
          <FiPlus size={16} className="text-indigo-200" /> Appoint User
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        <div className="overflow-x-auto relative z-10 custom-scrollbar max-h-[calc(100vh-200px)] min-h-[500px]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-white/20 backdrop-blur-md sticky top-0 z-20">
              <tr className="border-b border-white/40">
                <th className="p-5 pl-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Identity</th>
                <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Role / Designation</th>
                <th className="p-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Access Right</th>
                <th className="p-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">System Admin</th>
                <th className="p-5 pr-8 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16">
                   <div className="flex flex-col items-center justify-center text-slate-400">
                    <FiSearch size={32} className="mb-4 opacity-50 block mx-auto" />
                    <p className="font-black text-sm">No system users assigned.</p>
                  </div>
                </td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-white/40 transition-colors group cursor-default">
                  <td className="p-4 pl-8">
                    <p className="font-bold text-sm text-slate-800">{u.username}</p>
                    <p className="text-[10px] text-indigo-500 font-black">ID: {u.user_id}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-sm text-slate-700">{u.designation || 'General Staff'}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm backdrop-blur-sm border bg-emerald-100/60 text-emerald-700 border-emerald-200/50">
                      {u.access_right}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {u.is_admin ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100/60 border border-amber-200/60 shadow-sm">
                        <FiShield className="text-amber-600" size={16} />
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                  <td className="p-4 pr-8 text-right">
                    <button 
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-white/60 hover:bg-indigo-50 hover:border-indigo-200/60 text-indigo-600 font-bold text-xs transition-all shadow-sm group-hover:shadow-md" 
                      onClick={() => handleEdit(u)}
                    >
                      <FiEdit2 size={14} /> Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgb(0,0,0,0.15)] rounded-[2.5rem] w-full max-w-2xl relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-white/10 pointer-events-none" />
            
            <div className="p-6 lg:p-8 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editing ? 'Configure Profile' : 'Appoint User'}</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Access Management Matrix</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center text-slate-500 transition-colors shadow-sm border border-white/60">
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">System ID *</label>
                    <input 
                      className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner disabled:opacity-50" 
                      value={form.user_id} onChange={(e) => handleChange('user_id', e.target.value)} required disabled={editing} 
                      placeholder="e.g. EMP-001"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Username *</label>
                    <input 
                      className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                      value={form.username} onChange={(e) => handleChange('username', e.target.value)} required 
                      placeholder="Display Name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">{editing ? 'Regenerate Password (Optional)' : 'Secret Password *'}</label>
                    <input 
                      type="password" 
                      className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                      value={form.password} onChange={(e) => handleChange('password', e.target.value)} required={!editing} 
                      placeholder={editing ? "Leave blank to keep existing password" : "Enter a secure password"}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Job Title / Designation</label>
                    <input 
                      className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                      value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} 
                      placeholder="e.g. Head Librarian"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Role Clearance</label>
                    <select 
                      className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner appearance-none custom-select cursor-pointer" 
                      value={form.access_right} onChange={(e) => handleChange('access_right', e.target.value)}
                    >
                      <option value="STAFF">Staff Level</option>
                      <option value="LIBRARIAN">Librarian Level</option>
                      <option value="CIRCULATION_IN_CHARGE">Circulation Dept</option>
                      <option value="ADMIN">Administrator Level</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl backdrop-blur-sm">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <span className="text-sm font-black text-amber-900 drop-shadow-sm flex items-center gap-2">
                        <FiShield className="text-amber-600" /> Grant Root Privileges
                      </span>
                      <p className="text-[10px] font-bold text-amber-700/70 mt-1">This permits overriding system configs and editing other users.</p>
                    </div>
                    <div className="relative">
                      <input type="checkbox" checked={form.is_admin} onChange={(e) => handleChange('is_admin', e.target.checked)} className="peer sr-only" />
                      <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-2">
                  <button type="button" className="px-6 py-3 rounded-xl bg-white/50 hover:bg-white/80 text-slate-600 font-black text-[11px] uppercase tracking-wider transition-colors shadow-sm border border-white/60" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-[0_8px_20px_rgba(79,70,229,0.3)]" disabled={loading}>
                    {loading ? 'Authenticating...' : (editing ? 'Update Profile' : 'Appoint Network User')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
