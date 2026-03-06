import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiCalendar, FiX, FiCheck } from 'react-icons/fi';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [bookBarcode, setBookBarcode] = useState('');
  const [borrowerIdNo, setBorrowerIdNo] = useState('');
  const [book, setBook] = useState(null);
  const [borrower, setBorrower] = useState(null);
  const [reservedForDays, setReservedForDays] = useState(5);
  const [resNotes, setResNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch { toast.error('Failed to load reservations'); }
  };

  useEffect(() => { fetchReservations(); }, []);

  const lookupBook = async () => {
    if (!bookBarcode.trim()) return;
    try { setBook((await api.get(`/books/barcode/${bookBarcode}`)).data); }
    catch { toast.error('Book not found'); setBook(null); }
  };

  const lookupBorrower = async () => {
    if (!borrowerIdNo.trim()) return;
    try { setBorrower((await api.get(`/borrowers/idno/${borrowerIdNo}`)).data); }
    catch { toast.error('Borrower not found'); setBorrower(null); }
  };

  const handleReserve = async () => {
    if (!book || !borrower) return toast.error('Please look up both a book and a borrower');
    if (!window.confirm(`Save this new reservation?\n\n${borrower.firstname} ${borrower.lastname} reserving "${book.title}"?`)) return;
    setLoading(true);
    try {
      await api.post('/reservations', {
        book_id: book.id,
        borrower_id: borrower.id,
        reserved_for_days: reservedForDays,
        notes: resNotes,
      });
      toast.success('Reservation saved!');
      setShowForm(false);
      setBook(null); setBorrower(null); setBookBarcode(''); setBorrowerIdNo('');
      setResNotes('');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reservation failed');
    } finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) { toast.error('Cancel failed'); }
  };

  const handleFulfill = async (id) => {
    try {
      await api.put(`/reservations/${id}`, { status: 'Fulfilled' });
      toast.success('Reservation fulfilled');
      fetchReservations();
    } catch (err) { toast.error('Update failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Reservations</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiCalendar size={16} /> {showForm ? 'View List' : 'New Reservation'}
        </button>
      </div>

      {showForm ? (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Reserve Item</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Item Bar Code</label>
              <p className="text-xs text-gray-400 mb-1">(use a bar code scanner to locate the item)</p>
              <div className="flex gap-2">
                <input className="form-input" value={bookBarcode} onChange={(e) => setBookBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupBook()} />
                <button className="btn btn-outline" onClick={lookupBook}><FiSearch size={16} /></button>
              </div>
            </div>
            <div>
              <label className="form-label">Item Name</label>
              <input className="form-input bg-gray-50 mt-6" readOnly value={book ? book.title : ''} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Borrower ID / Bar Code</label>
              <p className="text-xs text-gray-400 mb-1">(use a bar code scanner to locate a borrower)</p>
              <div className="flex gap-2">
                <input className="form-input" value={borrowerIdNo} onChange={(e) => setBorrowerIdNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupBorrower()} />
                <button className="btn btn-outline" onClick={lookupBorrower}><FiSearch size={16} /></button>
              </div>
            </div>
            <div>
              <label className="form-label">Reserved By</label>
              <input className="form-input bg-gray-50 mt-6" readOnly value={borrower ? `${borrower.firstname} ${borrower.lastname}` : ''} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="form-label">Reserved On</label>
              <input type="date" className="form-input bg-gray-50" readOnly value={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="form-label">Reserved For (days)</label>
              <input type="number" min="1" max="30" className="form-input" value={reservedForDays} onChange={(e) => setReservedForDays(parseInt(e.target.value) || 5)} />
            </div>
            <div>
              <label className="form-label">Default Reservation Period (days)</label>
              <input className="form-input bg-gray-50" readOnly value="5" />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={resNotes} onChange={(e) => setResNotes(e.target.value)} />
          </div>

          {book && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
              <div><span className="text-gray-500">Copies Available:</span> <span className="font-bold">{book.copies_available}</span></div>
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={handleReserve} disabled={loading}>
              <FiCalendar size={16} /> {loading ? 'Saving...' : 'Reserve'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              <FiX size={16} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Reserved On</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-8">No reservations found</td></tr>
                ) : reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.book_title}</td>
                    <td>{r.borrower_name}</td>
                    <td>{r.reserved_on}</td>
                    <td>{r.reserved_for_days}</td>
                    <td>
                      <span className={`badge ${r.status === 'Active' ? 'badge-active' : r.status === 'Fulfilled' ? 'badge-returned' : 'badge-inactive'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'Active' && (
                        <div className="flex gap-2">
                          <button className="btn btn-success text-xs py-1 px-2" onClick={() => handleFulfill(r.id)}>
                            <FiCheck size={14} /> Fulfill
                          </button>
                          <button className="btn btn-danger text-xs py-1 px-2" onClick={() => handleCancel(r.id)}>
                            <FiX size={14} /> Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
