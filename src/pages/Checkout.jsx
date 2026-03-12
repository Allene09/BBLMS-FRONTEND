import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiMagnifyingGlass as FiSearch, PiCheck as FiCheck, PiX as FiX, PiListBullets as FiList } from 'react-icons/pi';

export default function Checkout() {
  const [bookBarcode, setBookBarcode] = useState('');
  const [borrowerIdNo, setBorrowerIdNo] = useState('');
  const [book, setBook] = useState(null);
  const [borrower, setBorrower] = useState(null);
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default due date to 3 days from now
  useEffect(() => {
    const due = new Date();
    due.setDate(due.getDate() + 3);
    setDueDate(due.toISOString().split('T')[0]);
  }, []);

  const lookupBook = async () => {
    if (!bookBarcode.trim()) return;
    try {
      const res = await api.get(`/books/barcode/${bookBarcode}`);
      setBook(res.data);
      if (res.data.copies_available <= 0) toast.error('No copies available for this book');
    } catch {
      toast.error('Book not found'); setBook(null);
    }
  };

  const lookupBorrower = async () => {
    if (!borrowerIdNo.trim()) return;
    try {
      const res = await api.get(`/borrowers/idno/${borrowerIdNo}`);
      setBorrower(res.data);
      // Load borrower's active loans
      const loansRes = await api.get(`/transactions/borrower/${res.data.id}`);
      setBorrowerLoans(loansRes.data);
    } catch {
      toast.error('Borrower not found'); setBorrower(null); setBorrowerLoans([]);
    }
  };

  const handleCheckout = async () => {
    if (!book) return toast.error('Please look up a book first');
    if (!borrower) return toast.error('Please look up a borrower first');
    if (!dueDate) return toast.error('Please set a due date');
    if (book.copies_available <= 0) return toast.error('No copies available');

    setLoading(true);
    try {
      await api.post('/transactions/checkout', {
        book_id: book.id,
        borrower_id: borrower.id,
        loan_date: loanDate,
        due_date: dueDate,
        notes,
      });
      toast.success('Book checked out successfully!');
      // Refresh data
      setBook(null); setBookBarcode('');
      const loansRes = await api.get(`/transactions/borrower/${borrower.id}`);
      setBorrowerLoans(loansRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally { setLoading(false); }
  };

  const handleClear = () => {
    setBook(null); setBorrower(null); setBookBarcode(''); setBorrowerIdNo('');
    setBorrowerLoans([]); setNotes('');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Check-out</h1>
        <p className="text-sm text-gray-400 mt-0.5">Process book loans to borrowers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left side - Menu buttons */}
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Menu</h3>
            <div className="space-y-2">
              <button className="btn btn-primary w-full" onClick={handleCheckout} disabled={loading || !book || !borrower}>
                <FiCheck size={16} /> {loading ? 'Processing...' : 'Loan and Close'}
              </button>
              <button className="btn btn-secondary w-full" onClick={handleClear}>
                <FiX size={16} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Center - Process checkout form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
              <FiList size={16} /> Process Check-out Transactions
            </h3>

            {/* Item Section */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Item</p>
              <p className="text-xs text-gray-400 mb-2">(Use Bar Code to locate the item)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Item Bar Code</label>
                  <div className="flex gap-2">
                    <input className="form-input" value={bookBarcode} onChange={(e) => setBookBarcode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && lookupBook()} placeholder="Scan or enter barcode" />
                    <button className="btn btn-outline" onClick={lookupBook}><FiSearch size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Loaned Item</label>
                  <input className="form-input bg-gray-50" readOnly value={book ? book.title : ''} />
                </div>
              </div>
            </div>

            {/* Borrower Section */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Borrower</p>
              <p className="text-xs text-gray-400 mb-2">(Use Bar Code scanner to locate a borrower)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Borrower ID / Bar Code</label>
                  <div className="flex gap-2">
                    <input className="form-input" value={borrowerIdNo} onChange={(e) => setBorrowerIdNo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && lookupBorrower()} placeholder="Enter borrower ID" />
                    <button className="btn btn-outline" onClick={lookupBorrower}><FiSearch size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Loaned To</label>
                  <input className="form-input bg-gray-50" readOnly value={borrower ? `${borrower.firstname} ${borrower.lastname}` : ''} />
                </div>
              </div>
            </div>

            {/* Active Loans */}
            {borrowerLoans.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Items Loaned by this Borrower</p>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="data-table">
                    <thead>
                      <tr><th>Loaned Items</th><th>Due Date</th><th>Fine</th></tr>
                    </thead>
                    <tbody>
                      {borrowerLoans.map((loan) => (
                        <tr key={loan.id}>
                          <td>{loan.book_title}</td>
                          <td>{loan.due_date}</td>
                          <td>₱{loan.fine_amount?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dates and Notes */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Dates and Notes</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Loan Date</label>
                  <input type="date" className="form-input" value={loanDate} onChange={(e) => setLoanDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Return Date</label>
                  <input type="date" className="form-input bg-gray-50" readOnly />
                </div>
              </div>
              <div className="mt-3">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
