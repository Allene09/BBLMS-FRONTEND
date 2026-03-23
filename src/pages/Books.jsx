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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Library Items</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage and search the book catalog</p>
      </div>

      {/* Toolbar */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {canAddBooks && <button className="btn btn-primary" onClick={handleNew}><FiPlus size={16} /> New</button>}
          {canManageBooks && <button className="btn btn-warning" onClick={handleEdit}><FiEdit2 size={16} /> Edit</button>}
          {canManageBooks && <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 size={16} /> Delete</button>}
          <button className="btn btn-secondary" onClick={fetchBooks}><FiRefreshCw size={16} /> Refresh</button>

          <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <input
                type="text"
                className="form-input w-64"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>

      {/* Content: Table + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className="card lg:col-span-2 overflow-hidden p-0">
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="data-table">
              <thead className="sticky top-0">
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Type</th>
                  <th>Barcode</th>
                  <th>Copies</th>
                  <th className="text-center">+</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-8">No books found</td></tr>
                ) : books.map((book) => (
                  <tr
                    key={book.id}
                    className={selected?.id === book.id ? 'selected' : ''}
                    onClick={() => setSelected(book)}
                  >
                    <td className="font-medium max-w-xs truncate">{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.type}</td>
                    <td className="font-mono text-xs">{book.barcode || '-'}</td>
                    <td className="text-center">{book.copies_available}</td>
                    <td className="text-center">
                      {canIncrementCopies && (
                        <button
                          type="button"
                          className="btn btn-primary text-xs py-1 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddCopy(book);
                          }}
                          title="Add copy"
                          disabled={addingCopyId === book.id}
                        >
                          <FiPlus size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Panel */}
        <div className="card">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Book Details</h3>
          {selected ? (
            <div className="space-y-2 text-sm">
              {[
                ['Title', selected.title],
                ['Author', selected.author],
                ['Co-Author', selected.co_author],
                ['Type', selected.type],
                ['Publisher', selected.publisher],
                ['Place', selected.place],
                ['Date', selected.date_published],
                ['Volume', selected.volume],
                ['Series', selected.series],
                ['Category', selected.category],
                ['Format', selected.format],
                ['ISBN', selected.isbn],
                ['Accession No', selected.accession_no],
                ['Call No', selected.call_no],
                ['Barcode', selected.barcode],
                ['Location', selected.location],
                ['Circulation', selected.circulation_type],
                ['Copies', selected.copies_available],
                ['Price', `₱${selected.price || 0}`],
              ].map(([label, val]) => (
                <div key={label} className="flex">
                  <span className="w-28 text-gray-500 font-medium shrink-0">{label}:</span>
                  <span className="text-gray-800">{val || 'none'}</span>
                </div>
              ))}
              
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Select a book to view details</p>
          )}
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
  );
}
