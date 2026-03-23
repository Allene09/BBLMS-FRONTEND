import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiMagnifyingGlass as FiSearch, PiCheck as FiCheck } from 'react-icons/pi';

export default function Checkin() {
  const [search, setSearch] = useState('');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returningId, setReturningId] = useState(null);

  const loadActiveLoans = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/active-loans', {
        params: { search: query || null },
      });
      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load active loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveLoans('');
  }, []);

  const handleReturnBook = async (loan) => {
    setReturningId(loan.id);
    try {
      const res = await api.post(`/transactions/checkin/${loan.id}`, {
        return_date: new Date().toISOString().split('T')[0],
      });

      const totalFine = Number(res.data?.totalFine || 0);
      if (totalFine > 0) {
        toast.success(`Book returned. Fine: PHP ${totalFine.toFixed(2)}`);
      } else {
        toast.success('Book returned successfully');
      }

      await loadActiveLoans(search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to return book');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Return Book</h1>
        <p className="text-sm text-gray-400 mt-0.5">Search borrowed books by borrower or title, then return with auto fine computation</p>
      </div>

      <div className="card mb-4">
        <div className="flex gap-2">
          <input
            className="form-input"
            placeholder="Search by borrower name, ID No, book title, author, or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadActiveLoans(search)}
          />
          <button className="btn btn-outline" onClick={() => loadActiveLoans(search)}>
            <FiSearch size={16} />
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Book Title</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
                <th>Fine</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">Loading active loans...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">No active borrowed books found</td></tr>
              ) : loans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <p className="font-medium text-gray-900">{loan.borrower_name}</p>
                    <p className="text-xs text-gray-500">{loan.borrower_id_no}</p>
                  </td>
                  <td>
                    <p className="font-medium text-gray-900">{loan.book_title}</p>
                    <p className="text-xs text-gray-500">{loan.book_author || '-'}</p>
                  </td>
                  <td>{loan.due_date}</td>
                  <td>{loan.days_overdue}</td>
                  <td>PHP {Number(loan.suggested_fine || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${loan.current_status === 'Overdue' ? 'badge-overdue' : 'badge-loaned'}`}>
                      {loan.current_status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-success text-xs py-1 px-2"
                      disabled={returningId === loan.id}
                      onClick={() => handleReturnBook(loan)}
                    >
                      <FiCheck size={14} /> {returningId === loan.id ? 'Returning...' : 'Return Book'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
