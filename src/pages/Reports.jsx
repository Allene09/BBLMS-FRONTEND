import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCurrency(value) {
  return `PHP ${Number(value || 0).toFixed(2)}`;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDayLabel(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

function dateDiffInDays(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / ms);
}

function buildMonthlyOrDaily(rows, from, to) {
  const fromDate = toDate(from);
  const toDateValue = toDate(to);
  const hasRange = Boolean(fromDate && toDateValue && toDateValue >= fromDate);
  const useDaily = hasRange && dateDiffInDays(fromDate, toDateValue) <= 31;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (useDaily) {
    const map = new Map();
    const cursor = new Date(fromDate);

    while (cursor <= toDateValue) {
      map.set(formatDayLabel(cursor), {
        label: formatDayLabel(cursor),
        Borrowed: 0,
        Returned: 0,
        Overdue: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    rows.forEach((row) => {
      const status = String(row.status || '').toLowerCase();
      const loanDate = toDate(row.loan_date);
      const returnDate = toDate(row.return_date);
      const dueDate = toDate(row.due_date);
      const isOverdue = dueDate && dueDate < today && status !== 'returned';

      if (status === 'loaned' && loanDate) {
        const key = formatDayLabel(loanDate);
        if (map.has(key)) map.get(key).Borrowed += 1;
      }

      if (status === 'returned' && returnDate) {
        const key = formatDayLabel(returnDate);
        if (map.has(key)) map.get(key).Returned += 1;
      }

      if (isOverdue && dueDate) {
        const key = formatDayLabel(dueDate);
        if (map.has(key)) map.get(key).Overdue += 1;
      }
    });

    return { chartData: Array.from(map.values()), xMode: 'Days' };
  }

  const selectedYear = fromDate?.getFullYear() || new Date().getFullYear();
  const chartData = MONTH_LABELS.map((label) => ({
    label,
    Borrowed: 0,
    Returned: 0,
    Overdue: 0,
  }));

  rows.forEach((row) => {
    const status = String(row.status || '').toLowerCase();
    const loanDate = toDate(row.loan_date);
    const returnDate = toDate(row.return_date);
    const dueDate = toDate(row.due_date);
    const isOverdue = dueDate && dueDate < today && status !== 'returned';

    if (status === 'loaned' && loanDate && loanDate.getFullYear() === selectedYear) {
      chartData[loanDate.getMonth()].Borrowed += 1;
    }

    if (status === 'returned' && returnDate && returnDate.getFullYear() === selectedYear) {
      chartData[returnDate.getMonth()].Returned += 1;
    }

    if (isOverdue && dueDate && dueDate.getFullYear() === selectedYear) {
      chartData[dueDate.getMonth()].Overdue += 1;
    }
  });

  return { chartData, xMode: 'Months' };
}

function buildYearly(rows) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const years = new Set();
  rows.forEach((row) => {
    const loanDate = toDate(row.loan_date);
    const returnDate = toDate(row.return_date);
    const dueDate = toDate(row.due_date);
    if (loanDate) years.add(loanDate.getFullYear());
    if (returnDate) years.add(returnDate.getFullYear());
    if (dueDate) years.add(dueDate.getFullYear());
  });

  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }

  const sortedYears = Array.from(years).sort((a, b) => a - b);
  const yearMap = new Map(
    sortedYears.map((year) => [String(year), { label: String(year), Borrowed: 0, Returned: 0, Overdue: 0 }])
  );

  rows.forEach((row) => {
    const status = String(row.status || '').toLowerCase();
    const loanDate = toDate(row.loan_date);
    const returnDate = toDate(row.return_date);
    const dueDate = toDate(row.due_date);
    const isOverdue = dueDate && dueDate < today && status !== 'returned';

    if (status === 'loaned' && loanDate) {
      yearMap.get(String(loanDate.getFullYear())).Borrowed += 1;
    }

    if (status === 'returned' && returnDate) {
      yearMap.get(String(returnDate.getFullYear())).Returned += 1;
    }

    if (isOverdue && dueDate) {
      yearMap.get(String(dueDate.getFullYear())).Overdue += 1;
    }
  });

  return { chartData: Array.from(yearMap.values()), xMode: 'Years' };
}

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [analyticsMode, setAnalyticsMode] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const loadOverview = async () => {
    try {
      const res = await api.get('/reports/overview');
      setOverview(res.data);
    } catch {
      toast.error('Failed to load report overview');
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/transactions', {
        params: {
          from: from || null,
          to: to || null,
          status: status || null,
          search: search || null,
        },
      });
      setRows(Array.isArray(res.data.rows) ? res.data.rows : []);
      setSummary(res.data.summary || null);
    } catch {
      toast.error('Failed to load transaction report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadTransactions();
  }, []);

  const { chartData, xMode } = useMemo(() => {
    if (analyticsMode === 'yearly') {
      return buildYearly(rows);
    }
    return buildMonthlyOrDaily(rows, from, to);
  }, [rows, analyticsMode, from, to]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Overview and transaction reporting with filters</p>
        </div>
        <button className="btn btn-outline" onClick={() => { loadOverview(); loadTransactions(); }}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <div className="card"><p className="text-xs text-gray-500">Books</p><p className="text-xl font-bold">{overview?.stats?.totalBooks ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Borrowers</p><p className="text-xl font-bold">{overview?.stats?.totalBorrowers ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Transactions</p><p className="text-xl font-bold">{overview?.stats?.totalTransactions ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Active Loans</p><p className="text-xl font-bold">{overview?.stats?.activeLoans ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Overdue</p><p className="text-xl font-bold">{overview?.stats?.overdueLoans ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Total Fine</p><p className="text-xl font-bold">{formatCurrency(overview?.stats?.totalFine)}</p></div>
      </div>

      <div className="card mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-base font-extrabold text-gray-800">Analytics Overview</h3>
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${analyticsMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setAnalyticsMode('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${analyticsMode === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setAnalyticsMode('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          X-axis mode: {xMode}. Data updates dynamically when filters are applied.
        </p>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-3">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={chartData} margin={{ top: 16, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="loanedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="returnedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#047857" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="overdueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#B91C1C" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }}
                contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0' }}
              />
              <Legend verticalAlign="top" align="center" height={36} />
              <Bar
                dataKey="Borrowed"
                fill="url(#loanedGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={700}
                animationEasing="ease-out"
                name="Borrowed"
                activeBar={{ stroke: '#1d4ed8', strokeWidth: 1.5, opacity: 0.95 }}
              />
              <Bar
                dataKey="Returned"
                fill="url(#returnedGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                name="Returned"
                activeBar={{ stroke: '#047857', strokeWidth: 1.5, opacity: 0.95 }}
              />
              <Bar
                dataKey="Overdue"
                fill="url(#overdueGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={900}
                animationEasing="ease-out"
                name="Overdue"
                activeBar={{ stroke: '#b91c1c', strokeWidth: 1.5, opacity: 0.95 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Transaction Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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
            <label className="form-label">Search</label>
            <input className="form-input" placeholder="Borrower, title, barcode" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary w-full" onClick={loadTransactions}>Apply</button>
          </div>
          <div className="flex items-end">
            <button
              className="btn btn-secondary w-full"
              onClick={() => {
                setStatus('');
                setSearch('');
                setFrom('');
                setTo('');
                loadTransactions();
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4">
        <div className="card"><p className="text-xs text-gray-500">Filtered Transactions</p><p className="text-xl font-bold">{summary?.totalTransactions ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Loaned</p><p className="text-xl font-bold">{summary?.activeLoans ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Overdue</p><p className="text-xl font-bold">{summary?.overdueLoans ?? 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Returned / Fine</p><p className="text-xl font-bold">{summary?.returnedLoans ?? 0} / {formatCurrency(summary?.totalFine)}</p></div>
      </div>

      <div className="card p-0 overflow-hidden mb-4">
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
                <th>Fine</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">Loading report data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">No report rows found</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-medium text-gray-900">{row.borrower_name}</p>
                    <p className="text-xs text-gray-500">{row.borrower_id_no}</p>
                  </td>
                  <td>
                    <p className="font-medium text-gray-900">{row.book_title}</p>
                    <p className="text-xs text-gray-500">{row.book_barcode}</p>
                  </td>
                  <td>{row.loan_date || '-'}</td>
                  <td>{row.due_date || '-'}</td>
                  <td>{row.return_date || '-'}</td>
                  <td>
                    <span className={`badge ${row.status === 'Returned' ? 'badge-returned' : row.status === 'Overdue' ? 'badge-overdue' : 'badge-loaned'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{formatCurrency(row.total_fine)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
