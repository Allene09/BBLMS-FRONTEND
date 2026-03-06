import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiCheck, FiX, FiList, FiRotateCw } from 'react-icons/fi';

export default function Checkin() {
  const [bookBarcode, setBookBarcode] = useState('');
  const [borrowerIdNo, setBorrowerIdNo] = useState('');
  const [book, setBook] = useState(null);
  const [borrower, setBorrower] = useState(null);
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [selectedLoans, setSelectedLoans] = useState([]);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [fineAmount, setFineAmount] = useState(0);
  const [pastDueFines, setPastDueFines] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const lookupBook = async () => {
    if (!bookBarcode.trim()) return;
    try {
      const res = await api.get(`/books/barcode/${bookBarcode}`);
      setBook(res.data);
    } catch {
      toast.error('Book not found'); setBook(null);
    }
  };

  const lookupBorrower = async () => {
    if (!borrowerIdNo.trim()) return;
    try {
      const res = await api.get(`/borrowers/idno/${borrowerIdNo}`);
      setBorrower(res.data);
      const loansRes = await api.get(`/transactions/borrower/${res.data.id}`);
      setBorrowerLoans(loansRes.data);
      setSelectedLoans([]);
    } catch {
      toast.error('Borrower not found'); setBorrower(null); setBorrowerLoans([]);
    }
  };

  const toggleLoanSelection = (loanId) => {
    setSelectedLoans((prev) =>
      prev.includes(loanId) ? prev.filter((id) => id !== loanId) : [...prev, loanId]
    );
  };

  const handleCheckin = async () => {
    if (selectedLoans.length === 0) return toast.error('Select at least one item to return');
    setLoading(true);
    try {
      for (const loanId of selectedLoans) {
        await api.post(`/transactions/checkin/${loanId}`, {
          return_date: returnDate,
          fine_amount: fineAmount,
          past_due_fines: pastDueFines,
          notes,
        });
      }
      toast.success(`${selectedLoans.length} item(s) returned successfully!`);
      // Refresh
      if (borrower) {
        const loansRes = await api.get(`/transactions/borrower/${borrower.id}`);
        setBorrowerLoans(loansRes.data);
      }
      setSelectedLoans([]);
      setFineAmount(0);
      setPastDueFines(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    } finally { setLoading(false); }
  };

  const handleRenew = async () => {
    if (selectedLoans.length === 0) return toast.error('Select an item to renew');
    const newDue = prompt('Enter new due date (YYYY-MM-DD):');
    if (!newDue) return;
    try {
      for (const loanId of selectedLoans) {
        await api.post(`/transactions/renew/${loanId}`, { new_due_date: newDue });
      }
      toast.success('Loan(s) renewed');
      if (borrower) {
        const loansRes = await api.get(`/transactions/borrower/${borrower.id}`);
        setBorrowerLoans(loansRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Renew failed');
    }
  };

  const handleClear = () => {
    setBook(null); setBorrower(null); setBookBarcode(''); setBorrowerIdNo('');
    setBorrowerLoans([]); setSelectedLoans([]); setNotes('');
    setFineAmount(0); setPastDueFines(0);
  };

  const totalFine = fineAmount + pastDueFines;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Process Returns</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div className="card">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Menu</h3>
            <div className="space-y-2">
              <button className="btn btn-success w-full" onClick={handleCheckin} disabled={loading || selectedLoans.length === 0}>
                <FiCheck size={16} /> {loading ? 'Processing...' : 'Return and Close'}
              </button>
              <button className="btn btn-primary w-full" onClick={handleRenew} disabled={selectedLoans.length === 0}>
                <FiRotateCw size={16} /> Renew / Extend Loan
              </button>
              <button className="btn btn-secondary w-full" onClick={handleClear}>
                <FiX size={16} /> Clear
              </button>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Other Options</h4>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded" /> Auto Processing Mode
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
              <FiList size={16} /> Process Check-in Transactions
            </h3>

            {/* Item Section */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Item</p>
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

            {/* Items to return */}
            {borrowerLoans.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Select Returned Items</p>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="data-table">
                    <thead>
                      <tr><th className="w-10"></th><th>Loaned Items</th><th>Due Date</th><th>Fine</th></tr>
                    </thead>
                    <tbody>
                      {borrowerLoans.map((loan) => (
                        <tr key={loan.id} onClick={() => toggleLoanSelection(loan.id)}
                          className={selectedLoans.includes(loan.id) ? 'selected' : ''}>
                          <td><input type="checkbox" checked={selectedLoans.includes(loan.id)} onChange={() => toggleLoanSelection(loan.id)} /></td>
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

            {/* Dates */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Dates and Notes</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Loan Date</label>
                  <input type="date" className="form-input bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="form-label">Return Date</label>
                  <input type="date" className="form-input" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                </div>
              </div>
              <div className="mt-3">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            {/* Fine Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3 font-semibold uppercase">Fine</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Find Amount</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={fineAmount} onChange={(e) => setFineAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="form-label">Past Due Fines</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={pastDueFines} onChange={(e) => setPastDueFines(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="form-label">Total</label>
                  <input className="form-input bg-white font-bold text-red-600" readOnly value={`₱${totalFine.toFixed(2)}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
