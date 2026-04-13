import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PiPlus as FiPlus, PiPencilSimple as FiEdit2, PiTrash as FiTrash2, PiArrowsClockwise as FiRefreshCw, PiMagnifyingGlass as FiSearch, PiX as FiX, PiCheck as FiCheck, PiListBullets as FiList, PiCalendarCheck as FiCalendar } from 'react-icons/pi';

const emptyBook = {
  title: '', author: '', co_author: '', type: 'Book', publisher: '', place: '',
  date_published: '', volume: '', series: '', category: '', format: '', editor: '',
  illustrator: '', pages: '', isbn: '', physical_desc: '', accession_no: '',
  call_no: '', barcode: '', location: '', circulation_type: 'Loanable',
  price: 0, value: 0, purchased_date: '', evaluated_date: '', acquisition_date: '',
  copies_available: 1,
};

export default function Books() {
  const { user, transitioning } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canManageBooks = ['LIBRARIAN'].includes(user?.access_right);
  const canAddBooks = ['LIBRARIAN', 'STAFF'].includes(user?.access_right);
  const canIncrementCopies = user?.access_right === 'STAFF';
  const canSelfReserve = !canManageBooks;
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyBook });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingCopyId, setAddingCopyId] = useState(null);

  // Borrow states
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [myLoans, setMyLoans] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reservedForDays, setReservedForDays] = useState(5);
  const [reserveNotes, setReserveNotes] = useState('');

  // Return states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [autoBorrowHandled, setAutoBorrowHandled] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await api.get('/books', { params: { search: search || undefined } });
      setBooks(res.data);
    } catch (err) {
      toast.error('Failed to load books');
    }
  };

  const fetchMyLoans = async () => {
    try {
      const res = await api.get('/books/my-loans');
      setMyLoans(res.data);
    } catch {
      // Silently fail - user might not have loans
    }
  };

  const fetchMyReservations = async () => {
    try {
      const res = await api.get('/reservations/mine');
      setMyReservations(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Silently fail - reservation list is secondary in this page
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchMyLoans();
    fetchMyReservations();
  }, []);

  // Set default due date (3 days from now)
  useEffect(() => {
    if (showBorrowModal) {
      const due = new Date();
      due.setDate(due.getDate() + 3);
      setDueDate(due.toISOString().split('T')[0]);
    }
  }, [showBorrowModal]);

  useEffect(() => {
    if (autoBorrowHandled) return;
    if (transitioning) return;

    const borrowBookId = location.state?.borrowBookId;
    const autoBorrow = location.state?.autoBorrow;

    if (!borrowBookId || !autoBorrow || books.length === 0) return;

    const targetBook = books.find((b) => String(b.id) === String(borrowBookId));
    if (!targetBook) {
      toast.error('Selected book is not available in the current list.');
      setAutoBorrowHandled(true);
      navigate('/app/books', { replace: true });
      return;
    }

    setSelected(targetBook);

    if (targetBook.copies_available <= 0) {
      toast.error('Selected book has no available copies.');
      setAutoBorrowHandled(true);
      navigate('/app/books', { replace: true });
      return;
    }

    if (targetBook.circulation_type === 'Reference' || targetBook.circulation_type === 'Room-Use Only') {
      toast.error('Selected book is not available for borrowing.');
      setAutoBorrowHandled(true);
      navigate('/app/books', { replace: true });
      return;
    }

    const openTimer = setTimeout(() => {
      setShowBorrowModal(true);
      setAutoBorrowHandled(true);
      navigate('/app/books', { replace: true });
    }, 150);

    return () => clearTimeout(openTimer);
  }, [autoBorrowHandled, books, location.state, navigate, transitioning]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleNew = () => {
    setForm({ ...emptyBook });
    setEditing(false);
    setShowModal(true);
  };

  const handleEdit = () => {
    if (!selected) return toast.error('Select a book first');
    setForm({ ...selected });
    setEditing(true);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selected) return toast.error('Select a book first');
    if (!window.confirm(`Delete "${selected.title}"?`)) return;
    try {
      await api.delete(`/books/${selected.id}`);
      toast.success('Book deleted');
      setSelected(null);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/books/${form.id}`, form);
        toast.success('Book updated');
      } else {
        await api.post('/books', form);
        toast.success('Book added');
      }
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCopy = async (book) => {
    setAddingCopyId(book.id);
    try {
      const updatedCopies = Number(book.copies_available || 0) + 1;
      const payload = { ...book, copies_available: updatedCopies };
      const res = await api.put(`/books/${book.id}`, payload);
      const updated = res.data;

      setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, ...updated } : b)));
      if (selected?.id === book.id) {
        setSelected((prev) => ({ ...prev, ...updated }));
      }
      toast.success(`Copies updated to ${updated.copies_available}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add copy');
    } finally {
      setAddingCopyId(null);
    }
  };

  // Borrow handlers
  const handleBorrowClick = () => {
    if (!selected) return toast.error('Select a book first');
    if (selected.copies_available <= 0) return toast.error('No copies available for this book');
    if (selected.circulation_type === 'Reference' || selected.circulation_type === 'Room-Use Only') {
      return toast.error('This item is not available for borrowing');
    }
    setShowBorrowModal(true);
  };

  const handleBorrowSubmit = async () => {
    if (!selected) return;
    if (!dueDate) return toast.error('Please set a due date');

    setBorrowLoading(true);
    try {
      await api.post('/books/borrow', {
        book_id: selected.id,
        due_date: dueDate,
      });
      toast.success(`Successfully borrowed "${selected.title}"!`);
      setShowBorrowModal(false);
      setSelected(null);
      fetchBooks();
      fetchMyLoans();
      fetchMyReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Borrow failed');
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleReserveClick = () => {
    if (!selected) return toast.error('Select a book first');
    if (selected.circulation_type === 'Reference' || selected.circulation_type === 'Room-Use Only') {
      return toast.error('This item is not available for reservation');
    }
    setReservedForDays(5);
    setReserveNotes('');
    setShowReserveModal(true);
  };

  const handleReserveSubmit = async () => {
    if (!selected) return;

    setReserveLoading(true);
    try {
      await api.post('/reservations/self', {
        book_id: selected.id,
        reserved_for_days: reservedForDays,
        notes: reserveNotes,
      });
      toast.success(`Reservation created for "${selected.title}"`);
      setShowReserveModal(false);
      fetchMyReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reservation failed');
    } finally {
      setReserveLoading(false);
    }
  };

  // Return handler
  const handleReturnBook = async (loan) => {
    if (!window.confirm(`Return "${loan.book_title}"?`)) return;
    setReturnLoading(true);
    try {
      await api.post(`/transactions/checkin/${loan.id}`, {
        return_date: new Date().toISOString().split('T')[0],
      });
      toast.success(`"${loan.book_title}" returned successfully!`);
      fetchMyLoans();
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed');
    } finally {
      setReturnLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Ambient background for Library Items - matching default Dashboard Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f5f3ff] z-0" />

      {/* Decorative blurred orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-blue-300/50 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-15%] left-[20%] w-[45rem] h-[45rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />

      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm flex items-center gap-3">
              Library Catalog
            </h1>
            <p className="text-sm lg:text-base text-slate-600/80 font-semibold mt-1">Manage, search, and explore full collection</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 flex flex-wrap items-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />

          <div className="flex gap-2 relative z-10 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
            {canAddBooks && (
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-[0_4px_15px_rgb(79,70,229,0.3)] hover:bg-indigo-700 hover:-translate-y-0.5 transition-all w-max" onClick={handleNew}>
                <FiPlus size={16} /> New Book
              </button>
            )}
            {canManageBooks && (
              <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all w-max ${selected ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'bg-white/50 text-slate-400 border-white/60 cursor-not-allowed'}`} onClick={handleEdit} disabled={!selected}>
                <FiEdit2 size={16} /> Edit
              </button>
            )}
            {canManageBooks && (
              <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all w-max ${selected ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : 'bg-white/50 text-slate-400 border-white/60 cursor-not-allowed'}`} onClick={handleDelete} disabled={!selected}>
                <FiTrash2 size={16} /> Delete
              </button>
            )}
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white/60 border border-white/60 hover:bg-white transition-all shadow-sm w-max" onClick={fetchBooks}>
              <FiRefreshCw size={16} /> Sync
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 lg:ml-auto relative z-10 min-w-[280px]">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 focus:bg-white/90 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm outline-none transition-all placeholder:text-slate-500/50 font-bold text-slate-800 shadow-sm"
                placeholder="Search collection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="hidden" />
          </form>
        </div>

      {/* Content: Table + Details */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Table Container - Dictates Organic Height */}
        <div className="bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col lg:w-2/3 xl:w-3/4 relative max-h-[70vh] min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative z-10 min-h-0">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-white/20 backdrop-blur-md sticky top-0 z-20">
                <tr className="border-b border-white/40">
                  <th className="p-5 pl-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Title</th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Author</th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Barcode</th>
                  <th className="p-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Copies</th>
                  <th className="p-5 pr-8 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30">
                {books.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-slate-500 py-12 font-bold bg-white/10">No books found matching criteria.</td></tr>
                ) : books.map((book) => {
                  const isSelected = selected?.id === book.id;
                  const noCopies = book.copies_available <= 0;
                  return (
                    <tr
                      key={book.id}
                      className={`cursor-pointer transition-colors duration-200 group ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-white/40'}`}
                      onClick={() => setSelected(book)}
                    >
                      <td className="p-4 pl-8 relative">
                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-r-md" />}
                        <span className={`font-bold text-sm block truncate max-w-[200px] xl:max-w-xs ${isSelected ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-700'}`}>{book.title}</span>
                        <span className="text-[10px] font-medium text-slate-500 block truncate max-w-[200px] xl:max-w-xs mt-0.5">{book.type}</span>
                      </td>
                      <td className={`p-4 text-xs font-semibold ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>{book.author || '-'}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded bg-white/50 border border-white/60 font-mono text-[10px] text-slate-600 shadow-sm">{book.barcode || 'N/A'}</span></td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-xl text-xs font-black shadow-sm backdrop-blur-sm border ${noCopies ? 'bg-red-100/60 text-red-700 border-red-200/50' : 'bg-emerald-100/60 text-emerald-700 border-emerald-200/50'}`}>
                          {book.copies_available}
                        </span>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        {canIncrementCopies && (
                          <button
                            type="button"
                            className="p-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-indigo-200/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCopy(book);
                            }}
                            title="Add copy"
                            disabled={addingCopyId === book.id}
                          >
                            <FiPlus size={14} className={addingCopyId === book.id ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Wrapper */}
        <div className="lg:w-1/3 xl:w-1/4 relative min-h-[500px] lg:min-h-0">
          <div className="lg:absolute lg:inset-0 bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 p-6 shadow-[0_8px_40px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
            <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Book Details
            </h3>
            {selected ? (
              <div className="text-sm relative z-10 flex-1 flex flex-col min-h-0">
                <div className="p-4 bg-white/40 border border-white/60 rounded-2xl shadow-sm mb-4 shadow-[0_4px_15px_rgb(0,0,0,0.02)] backdrop-blur-md shrink-0">
                  <p className="text-lg font-black text-slate-800 leading-tight mb-1">{selected.title}</p>
                  <p className="text-xs text-indigo-700 font-bold">{selected.author || 'Unknown Author'}</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-2">
                  <div className="flex flex-col gap-2 pb-4">
                    {[
                      ['Co-Author', selected.co_author],
                      ['Type', selected.type],
                      ['Date', selected.date_published],
                      ['Publisher', selected.publisher],
                      ['Place', selected.place],
                      ['Volume', selected.volume],
                      ['Series', selected.series],
                      ['Category', selected.category],
                      ['Format', selected.format],
                      ['Call No', selected.call_no],
                      ['Barcode', selected.barcode],
                      ['Accession No', selected.accession_no],
                      ['Location', selected.location],
                      ['Circulation', selected.circulation_type],
                      ['ISBN', selected.isbn],
                      ['Copies', selected.copies_available, selected.copies_available > 0 ? 'text-emerald-600 font-black' : 'text-red-500 font-black'],
                      ['Price', `₱${selected.price || 0}`],
                    ].map(([label, val, colorClass]) => val && (
                      <div key={label} className="group flex justify-between items-center py-2.5 border-b border-white/30 last:border-0 hover:bg-white/20 px-2 -mx-2 rounded-lg transition-colors">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 shrink-0">{label}</span>
                        <span className={`text-xs font-semibold text-right break-words max-w-[150px] ${colorClass || 'text-slate-800'}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-12 relative z-10 opacity-50">
                <FiList size={48} className="text-slate-400 mb-4" />
                <p className="text-slate-500 font-bold text-sm">Select an item</p>
                <p className="text-slate-400 text-xs">to view complete details</p>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Edit/Add Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Book' : 'New Book'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="form-label">Title *</label>
                    <input className="form-input" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Author</label>
                    <input className="form-input" value={form.author} onChange={(e) => handleChange('author', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Co-Author</label>
                    <input className="form-input" value={form.co_author} onChange={(e) => handleChange('co_author', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
                      <option>Book</option>
                      <option>Journal</option>
                      <option>Magazine</option>
                      <option>Thesis</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Publisher</label>
                    <input className="form-input" value={form.publisher} onChange={(e) => handleChange('publisher', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">ISBN</label>
                    <input className="form-input" value={form.isbn} onChange={(e) => handleChange('isbn', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Barcode</label>
                    <input className="form-input" value={form.barcode} onChange={(e) => handleChange('barcode', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Accession No</label>
                    <input className="form-input" value={form.accession_no} onChange={(e) => handleChange('accession_no', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Call No</label>
                    <input className="form-input" value={form.call_no} onChange={(e) => handleChange('call_no', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input className="form-input" value={form.location} onChange={(e) => handleChange('location', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Circulation Type</label>
                    <select className="form-input" value={form.circulation_type} onChange={(e) => handleChange('circulation_type', e.target.value)}>
                      <option>Loanable</option>
                      <option>Room-Use Only</option>
                      <option>Reference</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Copies Available</label>
                    <input type="number" min="0" className="form-input" value={form.copies_available} onChange={(e) => handleChange('copies_available', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <input className="form-input" value={form.category} onChange={(e) => handleChange('category', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Format</label>
                    <input className="form-input" value={form.format} onChange={(e) => handleChange('format', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Price (₱)</label>
                    <input type="number" min="0" step="0.01" className="form-input" value={form.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="form-label">Value (₱)</label>
                    <input type="number" min="0" step="0.01" className="form-input" value={form.value} onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editing ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Borrow Modal */}
        {showBorrowModal && selected && (
          <div className="modal-overlay" onClick={() => setShowBorrowModal(false)}>
            <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Borrow Book</h2>
                <button onClick={() => setShowBorrowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Book info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Selected Book</p>
                  <p className="text-base font-bold text-blue-900">{selected.title}</p>
                  <p className="text-sm text-blue-700">{selected.author}</p>
                  <div className="flex gap-4 mt-2 text-xs text-blue-600">
                    <span>Barcode: {selected.barcode || 'N/A'}</span>
                    <span>Available: {selected.copies_available}</span>
                  </div>
                </div>

                {/* Borrower info */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Borrower</p>
                  <p className="text-base font-bold text-gray-800">{user?.username}</p>
                  <p className="text-sm text-gray-600">ID: {user?.user_id}</p>
                </div>

                {/* Due date */}
                <div>
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-400 mt-1">Default: 3 days from today</p>
                </div>

                {/* My current loans */}
                {myLoans.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <FiList size={12} /> Your Current Loans ({myLoans.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto border rounded-lg">
                      {myLoans.map((loan) => (
                        <div key={loan.id} className="px-3 py-2 border-b last:border-b-0 text-sm flex justify-between items-center">
                          <span className="truncate max-w-[200px]">{loan.book_title}</span>
                          <span className={`badge text-xs ${loan.status?.toLowerCase() === 'loaned' ? 'badge-loaned' : 'badge-overdue'}`}>
                            Due: {loan.due_date?.split('T')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="button"
                  className="btn btn-success w-full py-3"
                  onClick={handleBorrowSubmit}
                  disabled={borrowLoading}
                >
                  <FiCheck size={16} /> {borrowLoading ? 'Processing...' : 'Confirm Borrow'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reserve Modal */}
        {showReserveModal && selected && (
          <div className="modal-overlay" onClick={() => setShowReserveModal(false)}>
            <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Reserve Book</h2>
                <button onClick={() => setShowReserveModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Selected Book</p>
                  <p className="text-base font-bold text-blue-900">{selected.title}</p>
                  <p className="text-sm text-blue-700">{selected.author}</p>
                  <div className="flex gap-4 mt-2 text-xs text-blue-600">
                    <span>Barcode: {selected.barcode || 'N/A'}</span>
                    <span>Available: {selected.copies_available}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Reserved By</p>
                  <p className="text-base font-bold text-gray-800">{user?.username}</p>
                  <p className="text-sm text-gray-600">ID: {user?.user_id}</p>
                </div>

                <div>
                  <label className="form-label">Reserved For (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="form-input"
                    value={reservedForDays}
                    onChange={(e) => setReservedForDays(parseInt(e.target.value, 10) || 5)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Default reservation period: 5 days</p>
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={reserveNotes}
                    onChange={(e) => setReserveNotes(e.target.value)}
                    placeholder="Optional note for your reservation"
                  />
                </div>

                {myReservations.filter((item) => item.status === 'Active').length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <FiList size={12} /> Your Active Reservations ({myReservations.filter((item) => item.status === 'Active').length})
                    </p>
                    <div className="max-h-32 overflow-y-auto border rounded-lg">
                      {myReservations.filter((item) => item.status === 'Active').map((reservation) => (
                        <div key={reservation.id} className="px-3 py-2 border-b last:border-b-0 text-sm flex justify-between items-center gap-3">
                          <span className="truncate max-w-[220px]">{reservation.book_title}</span>
                          <span className="badge badge-active text-xs">{reservation.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary w-full py-3"
                  onClick={handleReserveSubmit}
                  disabled={reserveLoading}
                >
                  <FiCalendar size={16} /> {reserveLoading ? 'Saving...' : 'Confirm Reservation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {showReturnModal && (
          <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
            <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Return Book</h2>
                  <p className="text-sm text-gray-500">Select a book to return</p>
                </div>
                <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FiList size={14} /> Your Active Loans ({myLoans.length})
                </h3>
                <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                  {myLoans.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <FiBookOpen size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active loans to return</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-semibold text-gray-600">Book</th>
                          <th className="text-left p-2 font-semibold text-gray-600">Due Date</th>
                          <th className="text-center p-2 font-semibold text-gray-600">Status</th>
                          <th className="text-center p-2 font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myLoans.map((loan) => (
                          <tr key={loan.id} className="border-t hover:bg-gray-50">
                            <td className="p-2 font-medium truncate max-w-[150px]">{loan.book_title}</td>
                            <td className="p-2 text-gray-600 text-xs">{loan.due_date?.split('T')[0]}</td>
                            <td className="p-2 text-center">
                              <span className={`badge ${loan.status?.toLowerCase() === 'overdue' ? 'badge-overdue' : 'badge-loaned'}`}>
                                {loan.status}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                className="btn btn-success text-xs py-1 px-2"
                                onClick={() => handleReturnBook(loan)}
                                disabled={returnLoading}
                              >
                                <FiCornerDownLeft size={12} /> Return
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
