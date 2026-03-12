import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiShield, FiBook, FiSearch, FiCheck, FiList } from 'react-icons/fi';

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

  // Borrow book states
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [userLoans, setUserLoans] = useState([]);

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
                      <button className="btn btn-success text-xs py-1 px-2" onClick={() => handleBorrowClick(u)}>
                        <FiBook size={14} /> Borrow
                      </button>
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

      {/* Edit/Add User Modal */}
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

      {/* Borrow Book Modal */}
      {showBorrowModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBorrowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Borrow Book</h2>
                <p className="text-sm text-gray-500">User: <span className="font-semibold text-blue-600">{selectedUser.username}</span> ({selectedUser.user_id})</p>
              </div>
              <button onClick={() => setShowBorrowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Book Selection */}
              <div className="space-y-4">
                <div>
                  <label className="form-label flex items-center gap-2">
                    <FiSearch size={14} /> Search Books
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="form-input"
                      placeholder="Search by title, author, barcode..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
                    />
                    <button type="button" className="btn btn-outline" onClick={searchBooks}>
                      <FiSearch size={16} />
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-semibold text-gray-600">Title</th>
                        <th className="text-left p-2 font-semibold text-gray-600">Author</th>
                        <th className="text-center p-2 font-semibold text-gray-600">Avail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.length === 0 ? (
                        <tr><td colSpan={3} className="text-center text-gray-400 py-4">No books available</td></tr>
                      ) : filteredBooks.map((book) => (
                        <tr
                          key={book.id}
                          className={`cursor-pointer hover:bg-blue-50 transition ${selectedBook?.id === book.id ? 'bg-blue-100' : ''} ${book.copies_available <= 0 ? 'opacity-50' : ''}`}
                          onClick={() => book.copies_available > 0 && setSelectedBook(book)}
                        >
                          <td className="p-2 font-medium truncate max-w-[180px]">{book.title}</td>
                          <td className="p-2 text-gray-600 truncate max-w-[100px]">{book.author || '-'}</td>
                          <td className="p-2 text-center">
                            <span className={`badge ${book.copies_available > 0 ? 'badge-active' : 'badge-inactive'}`}>
                              {book.copies_available}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedBook && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-600 font-semibold mb-1">Selected Book</p>
                    <p className="text-sm font-medium text-green-800">{selectedBook.title}</p>
                    <p className="text-xs text-green-600">{selectedBook.author} • {selectedBook.barcode || 'No barcode'}</p>
                  </div>
                )}

                <div>
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={handleBorrowSubmit}
                  disabled={borrowLoading || !selectedBook}
                >
                  <FiCheck size={16} /> {borrowLoading ? 'Processing...' : 'Confirm Checkout'}
                </button>
              </div>

              {/* Right: Current Loans */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FiList size={14} /> Current Loans ({userLoans.length})
                </h3>
                <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                  {userLoans.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <FiBook size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active loans</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-semibold text-gray-600">Book</th>
                          <th className="text-left p-2 font-semibold text-gray-600">Due</th>
                          <th className="text-center p-2 font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userLoans.map((loan) => (
                          <tr key={loan.id} className="border-t">
                            <td className="p-2 font-medium truncate max-w-[150px]">{loan.book_title}</td>
                            <td className="p-2 text-gray-600 text-xs">{loan.due_date?.split('T')[0]}</td>
                            <td className="p-2 text-center">
                              <span className={`badge ${loan.status === 'LOANED' ? 'badge-loaned' : loan.status === 'OVERDUE' ? 'badge-overdue' : 'badge-returned'}`}>
                                {loan.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
