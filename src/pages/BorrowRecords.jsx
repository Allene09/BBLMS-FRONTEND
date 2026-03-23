import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function inDateRange(value, fromDate, toDate) {
  if (!value) return false;
  const dateOnly = String(value).split('T')[0];
  if (fromDate && dateOnly < fromDate) return false;
  if (toDate && dateOnly > toDate) return false;
  return true;
}

export default function BorrowRecords() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', {
        params: {
          status: status || null,
          search: search || null,
        },
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load borrow records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filtered = useMemo(() => {
    if (!fromDate && !toDate) return rows;
    return rows.filter((row) => inDateRange(row.loan_date, fromDate, toDate));
  }, [rows, fromDate, toDate]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Borrow Records</h1>
        <p className="text-sm text-gray-400 mt-0.5">View all borrowed and returned transactions with date, borrower, and status filters</p>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="Loaned">Loaned</option>
              <option value="Overdue">Overdue</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
          <div>
            <label className="form-label">Borrower / Book</label>
            <input
              className="form-input"
              placeholder="Name, ID, title, barcode"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadRecords()}
            />
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn btn-primary" onClick={loadRecords}>Apply</button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setStatus('');
                setSearch('');
                setFromDate('');
                setToDate('');
                loadRecords();
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Book</th>
                <th>Loan Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Total Fine</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">No records found</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-medium text-gray-900">{row.borrower_name}</p>
                    <p className="text-xs text-gray-500">{row.borrower_id_no}</p>
                  </td>
                  <td>
                    <p className="font-medium text-gray-900">{row.book_title}</p>
                    <p className="text-xs text-gray-500">{row.book_barcode}</p>
                  </td>
                  <td>{row.loan_date}</td>
                  <td>{row.due_date}</td>
                  <td>{row.return_date || '-'}</td>
                  <td>
                    <span className={`badge ${row.status === 'Returned' ? 'badge-returned' : row.status === 'Overdue' ? 'badge-overdue' : 'badge-loaned'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>PHP {Number(row.total_fine || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
