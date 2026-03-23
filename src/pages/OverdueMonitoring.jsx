import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OverdueMonitoring() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOverdue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/overdue');
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load overdue records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverdue();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Overdue Monitoring</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monitor all overdue books with borrower and fine details</p>
        </div>
        <button className="btn btn-outline" onClick={loadOverdue}>Refresh</button>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">Loading overdue list...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No overdue books</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-medium text-gray-900">{row.borrower_name}</p>
                    <p className="text-xs text-gray-500">{row.borrower_id_no}</p>
                  </td>
                  <td>{row.book_title}</td>
                  <td>{row.due_date}</td>
                  <td>{row.days_overdue}</td>
                  <td>PHP {Number(row.estimated_fine || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
