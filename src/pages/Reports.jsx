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
import { FiRefreshCw, FiCalendar, FiFilter, FiSearch, FiList, FiTrendingUp } from 'react-icons/fi';

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
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f5f3ff] z-0" />
      
      {/* Soft floating gradient orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-blue-300/50 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />

      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight drop-shadow-sm mb-2">Reports</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">Overview & Analytics</p>
        </div>
        <button 
          onClick={() => { loadOverview(); loadTransactions(); }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/60 text-indigo-700 font-bold text-[11px] uppercase tracking-wider transition-all hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] shadow-sm"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6 relative z-10">
        {[
          ['Books', overview?.stats?.totalBooks ?? 0, 'bg-blue-500'],
          ['Borrowers', overview?.stats?.totalBorrowers ?? 0, 'bg-emerald-500'],
          ['Transactions', overview?.stats?.totalTransactions ?? 0, 'bg-purple-500'],
          ['Active', overview?.stats?.activeLoans ?? 0, 'bg-orange-500'],
          ['Overdue', overview?.stats?.overdueLoans ?? 0, 'bg-red-500'],
          ['Fine', formatCurrency(overview?.stats?.totalFine), 'bg-rose-500'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-white/30 backdrop-blur-2xl border border-white/60 shadow-[0_4px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 rounded-[1.5rem] p-5 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 ${color}`} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-800 xl:text-[22px] 2xl:text-2xl drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">{val}</p>
          </div>
        ))}
      </div>

      {/* Main Analytics Card */}
      <div className="bg-white/30 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-6 lg:p-8 mb-8 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-[2.5rem]" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" /> Analytics Overview
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1 hidden sm:block">
              X-axis mode: {xMode} — Dynamic filter rendering
            </p>
          </div>

          <div className="inline-flex rounded-full border border-white/60 bg-white/40 backdrop-blur-md p-1 shadow-inner">
            <button
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-full transition-all ${analyticsMode === 'monthly' ? 'bg-white text-blue-600 shadow-md drop-shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setAnalyticsMode('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-full transition-all ${analyticsMode === 'yearly' ? 'bg-white text-blue-600 shadow-md drop-shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setAnalyticsMode('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="h-[360px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="loanedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="returnedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="overdueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.4)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.3)' }}
                contentStyle={{ borderRadius: '1.5rem', borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '12px 20px' }}
                itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                labelStyle={{ color: '#475569', fontWeight: '900', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Legend verticalAlign="top" align="center" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }} />
              <Bar dataKey="Borrowed" fill="url(#loanedGradient)" radius={[8, 8, 8, 8]} animationDuration={1000} animationEasing="ease-out" barSize={32} activeBar={{ stroke: '#4f46e5', strokeWidth: 2, opacity: 0.95 }} />
              <Bar dataKey="Returned" fill="url(#returnedGradient)" radius={[8, 8, 8, 8]} animationDuration={1200} animationEasing="ease-out" barSize={32} activeBar={{ stroke: '#059669', strokeWidth: 2, opacity: 0.95 }} />
              <Bar dataKey="Overdue" fill="url(#overdueGradient)" radius={[8, 8, 8, 8]} animationDuration={1400} animationEasing="ease-out" barSize={32} activeBar={{ stroke: '#e11d48', strokeWidth: 2, opacity: 0.95 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Filters */}
      <div className="bg-white/30 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-6 lg:p-8 mb-8 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-[2.5rem]" />
        <h3 className="text-[10px] font-black text-slate-400 mb-5 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
          <FiFilter size={14} className="text-slate-400" /> Advanced Filtering
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
          <div className="lg:col-span-1 border border-white/50 bg-white/40 rounded-2xl p-1 shadow-inner flex items-center">
            <select className="w-full bg-transparent text-sm font-bold text-slate-700 pl-4 py-2 outline-none appearance-none custom-select cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Loaned">Loaned</option>
              <option value="Overdue">Overdue</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
          
          <div className="lg:col-span-2 relative group flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="text-indigo-400" size={16} />
            </div>
            <input 
              className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 pl-11 pr-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner placeholder:text-slate-400 placeholder:font-semibold" 
              placeholder="Search by borrower, title, barcode..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <div className="lg:col-span-1 relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black text-[9px] uppercase tracking-widest bg-white/50 h-full rounded-l-2xl border-r border-white/60 px-3">From</div>
            <input 
              type="date" 
              className="w-full bg-white/40 focus:bg-white/60 text-slate-700 text-sm font-bold rounded-2xl border border-white/50 pl-[64px] pr-3 py-3 outline-none transition-all shadow-inner" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
            />
          </div>

          <div className="lg:col-span-1 relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black text-[9px] uppercase tracking-widest bg-white/50 h-full rounded-l-2xl border-r border-white/60 px-3">To</div>
            <input 
              type="date" 
              className="w-full bg-white/40 focus:bg-white/60 text-slate-700 text-sm font-bold rounded-2xl border border-white/50 pl-[52px] pr-3 py-3 outline-none transition-all shadow-inner" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
            />
          </div>

          <div className="lg:col-span-1 flex items-center gap-2">
            <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-indigo-500/30 text-center" onClick={loadTransactions}>
              Apply
            </button>
            <button
              className="px-4 bg-white/50 hover:bg-white/80 text-slate-600 rounded-2xl py-3 text-xs font-black uppercase tracking-wider transition-colors shadow-sm border border-white/60 text-center"
              onClick={() => { setStatus(''); setSearch(''); setFrom(''); setTo(''); loadTransactions(); }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Filtered Data Summaries */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6 relative z-10">
        <div className="bg-white/30 backdrop-blur-2xl border border-white/60 shadow-sm rounded-3xl p-5 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Queried Trans.</p><p className="text-xl font-black text-slate-800">{summary?.totalTransactions ?? 0}</p></div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center"><FiList className="text-indigo-600" size={18} /></div>
        </div>
        <div className="bg-white/30 backdrop-blur-2xl border border-white/60 shadow-sm rounded-3xl p-5 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Loaned</p><p className="text-xl font-black text-slate-800">{summary?.activeLoans ?? 0}</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><FiTrendingUp className="text-blue-600" size={18} /></div>
        </div>
        <div className="bg-white/30 backdrop-blur-2xl border border-white/60 shadow-sm rounded-3xl p-5 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Overdue</p><p className="text-xl font-black text-slate-800">{summary?.overdueLoans ?? 0}</p></div>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><FiCalendar className="text-red-600" size={18} /></div>
        </div>
        <div className="bg-white/30 backdrop-blur-2xl border border-white/60 shadow-sm rounded-3xl p-5 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Recovered / Fines</p><p className="text-xl font-black text-slate-800">{summary?.returnedLoans ?? 0} <span className="text-sm font-semibold text-slate-500">/ {formatCurrency(summary?.totalFine)}</span></p></div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><FiRefreshCw className="text-emerald-600" size={18} /></div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden relative z-10 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        <div className="overflow-x-auto relative z-10 max-h-[800px] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-white/20 backdrop-blur-md sticky top-0 z-20">
              <tr className="border-b border-white/40">
                <th className="p-5 pl-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Borrower</th>
                <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Library Item</th>
                <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Dates</th>
                <th className="p-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Status</th>
                <th className="p-5 pr-8 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Accrued Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FiRefreshCw size={24} className="animate-spin mb-3 text-indigo-400" />
                    <p className="font-bold text-sm">Compiling Report...</p>
                  </div>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16">
                   <div className="flex flex-col items-center justify-center text-slate-400">
                    <FiSearch size={32} className="mb-4 opacity-50 block mx-auto" />
                    <p className="font-black text-sm">No historical records found for constraints.</p>
                  </div>
                </td></tr>
              ) : rows.map((row) => {
                const statusTheme = 
                  row.status === 'Returned' ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200/50' : 
                  row.status === 'Overdue' ? 'bg-red-100/60 text-red-700 border-red-200/50' : 
                  'bg-blue-100/60 text-blue-700 border-blue-200/50';

                return (
                  <tr key={row.id} className="hover:bg-white/40 transition-colors group cursor-default">
                    <td className="p-4 pl-8">
                      <p className="font-bold text-sm text-slate-800">{row.borrower_name}</p>
                      <p className="text-[10px] text-indigo-500 font-black">{row.borrower_id_no}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800 line-clamp-1">{row.book_title}</p>
                      <div className="mt-1 flex items-center">
                        <span className="px-1.5 py-0.5 rounded bg-white/50 border border-white/60 font-mono text-[10px] text-slate-500 shadow-sm">{row.book_barcode}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-bold text-slate-600"><span className="text-slate-400 w-10 inline-block">OUT:</span> {row.loan_date || '-'}</p>
                        <p className="text-[11px] font-bold text-slate-600"><span className="text-slate-400 w-10 inline-block">DUE:</span> {row.due_date || '-'}</p>
                        {row.return_date && <p className="text-[11px] font-bold text-slate-600"><span className="text-slate-400 w-10 inline-block">IN:</span> {row.return_date}</p>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm backdrop-blur-sm border ${statusTheme}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 pr-8 text-right font-black text-slate-800">
                      {row.total_fine > 0 ? (
                        <span className="text-red-500">{formatCurrency(row.total_fine)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
