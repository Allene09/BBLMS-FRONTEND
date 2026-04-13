import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  PiBooks as FiBook, PiUsersThree as FiUsers, PiArrowCircleRight as FiArrowRightCircle, PiWarning as FiAlertTriangle,
  PiCalendarCheck as FiCalendar, PiTruck as FiTruck, PiCheckCircle as FiCheckCircle, PiCurrencyDollar as FiDollarSign,
  PiTrendUp as FiTrendingUp, PiArrowsClockwise as FiRefreshCw,
} from 'react-icons/pi';

const statConfigs = [
  { key: 'totalBooks',        label: 'Total Books',     icon: FiBook,             gradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)', accent: '#60a5fa', bg: 'rgba(37,99,235,0.08)' },
  { key: 'totalBorrowers',    label: 'Borrowers',       icon: FiUsers,            gradient: 'linear-gradient(135deg,#059669,#047857)', accent: '#34d399', bg: 'rgba(5,150,105,0.08)' },
  { key: 'activeLoans',       label: 'Active Loans',    icon: FiArrowRightCircle, gradient: 'linear-gradient(135deg,#d97706,#b45309)', accent: '#fbbf24', bg: 'rgba(217,119,6,0.08)' },
  { key: 'overdueLoans',      label: 'Overdue',         icon: FiAlertTriangle,    gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)', accent: '#f87171', bg: 'rgba(220,38,38,0.08)' },
  { key: 'activeReservations',label: 'Reservations',    icon: FiCalendar,         gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)', accent: '#a78bfa', bg: 'rgba(124,58,237,0.08)' },
  { key: 'totalSuppliers',    label: 'Suppliers',       icon: FiTruck,            gradient: 'linear-gradient(135deg,#0891b2,#0e7490)', accent: '#22d3ee', bg: 'rgba(8,145,178,0.08)' },
  { key: 'totalReturned',     label: 'Returned',        icon: FiCheckCircle,      gradient: 'linear-gradient(135deg,#10b981,#059669)', accent: '#6ee7b7', bg: 'rgba(16,185,129,0.08)' },
  { key: '_fines',            label: 'Total Fines',     icon: FiDollarSign,       gradient: 'linear-gradient(135deg,#ea580c,#c2410c)', accent: '#fb923c', bg: 'rgba(234,88,12,0.08)' },
];

function useCountUp(target, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const num = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num === 0) { setCount(num || 0); return; }
    const duration = 900;
    const steps = 40;
    const increment = num / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + increment, num);
      setCount(current);
      if (current >= num) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [active, target]);
  return count;
}

function StatCard({ cfg, value, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isNumeric = !isNaN(parseFloat(String(value).replace(/[^0-9.]/g, ''))) && String(value).replace(/[^0-9.]/g, '') !== '';
  const isFine = String(value).startsWith('₱');
  const displayValue = visible && isNumeric
    ? isFine
      ? `₱${parseFloat(String(value).replace('₱', '')).toFixed(2) === count.toFixed(2) ? count.toFixed(2) : count.toFixed(2)}`
      : Math.round(count)
    : value;

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${index * 80}ms` }}
      className={`bg-white/30 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${
        visible ? 'anim-fade-up' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      
      {/* Glowing background orb for the card */}
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full filter blur-[40px] opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-50" style={{ background: cfg.accent }} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-5">
          <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 shadow-sm border border-white/60 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 opacity-20" style={{ background: cfg.gradient }} />
            <div className="relative z-10 p-3 rounded-xl bg-white/40 backdrop-blur-md shadow-sm">
              <cfg.icon size={26} style={{ color: cfg.accent }} className="drop-shadow-sm" />
            </div>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 bg-white/50 border border-white/60 shadow-sm backdrop-blur-md">
            <FiTrendingUp size={12} style={{ color: cfg.accent }} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: cfg.accent }}>Active</span>
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-3xl lg:text-4xl font-black text-slate-800 leading-none mb-1.5 drop-shadow-sm tracking-tight">{displayValue}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">{cfg.label}</p>
        </div>
      </div>
    </div>
  );
}

const statusStyle = {
  Loaned:   { bg: '#dbeafe', color: '#1e40af' },
  Returned: { bg: '#d1fae5', color: '#065f46' },
  Overdue:  { bg: '#fee2e2', color: '#991b1b' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="card text-red-500 text-sm p-6">Failed to load dashboard data.</div>
  );

  const statValues = {
    totalBooks: stats.totalBooks,
    totalBorrowers: stats.totalBorrowers,
    activeLoans: stats.activeLoans,
    overdueLoans: stats.overdueLoans,
    activeReservations: stats.activeReservations,
    totalSuppliers: stats.totalSuppliers,
    totalReturned: stats.totalReturned,
    _fines: `₱${Number(stats.totalFines ?? 0).toFixed(2)}`,
  };

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Soft blurred gradient background - Dashboard default Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f5f3ff] z-0" />
      
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[120px] z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-15%] left-[20%] w-[45rem] h-[45rem] bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-[150px] z-0" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">Dashboard</h1>
            <p className="text-sm lg:text-base text-slate-600/80 font-semibold mt-1 ml-1">Library overview and real-time statistics</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-blue-700 bg-white/40 border border-white/60 hover:bg-white/60 transition-all duration-300 disabled:opacity-50 shadow-[0_4px_15px_rgb(0,0,0,0.02)] backdrop-blur-md"
          >
            <FiRefreshCw size={16} className={`${refreshing ? 'animate-spin text-blue-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {refreshing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statConfigs.map((cfg, i) => (
          <StatCard key={cfg.key} cfg={cfg} value={statValues[cfg.key]} index={i} />
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col flex-1 relative min-h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        
        <div className="px-8 py-6 border-b border-white/40 flex items-center justify-between relative z-10 bg-white/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center border border-white/60 shadow-sm text-indigo-500">
               <FiBook size={24} />
             </div>
             <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Recent Transactions</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/70 mt-1">Live Circulation Stream</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-indigo-700 font-bold bg-indigo-100/50 border border-indigo-200/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
            {stats.recentLoans.length} Event{stats.recentLoans.length !== 1 && 's'} Found
          </span>
        </div>

        {stats.recentLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-14 text-center relative z-10">
            <div className="w-20 h-20 rounded-full bg-white/50 border border-white/60 shadow-inner flex items-center justify-center mb-5">
              <FiBook size={32} className="text-indigo-300" />
            </div>
            <p className="text-slate-700 text-lg font-bold tracking-tight">No Live Transactions</p>
            <p className="text-slate-500/70 text-xs font-semibold mt-1">Checked-out books will appear here instantly</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-white/20 backdrop-blur-md sticky top-0 z-20">
                <tr className="border-b border-white/40">
                  <th className="p-5 pl-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Book Detail</th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Borrower</th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80">Loan Timeline</th>
                  <th className="p-5 pr-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30">
                {stats.recentLoans.map((loan) => {
                  const isReturned = loan.status === 'Returned';
                  const isOverdue = loan.status === 'Overdue';
                  return (
                    <tr key={loan.id} className="group hover:bg-white/40 transition-colors duration-200">
                      <td className="p-5 pl-8">
                        <span className="font-bold text-slate-800 text-sm">{loan.book_title}</span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm border border-white/60 ${isReturned ? 'bg-emerald-100/50 text-emerald-700' : isOverdue ? 'bg-red-100/50 text-red-700' : 'bg-indigo-100/50 text-indigo-700'}`}>
                             {loan.borrower_name?.charAt(0).toUpperCase()}
                           </div>
                           <span className="font-bold text-slate-700 text-sm">{loan.borrower_name}</span>
                        </div>
                      </td>
                      <td className="p-5">
                         <div className="flex flex-col gap-0.5">
                           <span className="text-xs font-semibold text-slate-700">Issued: <span className="font-mono text-slate-600 bg-white/40 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/40">{loan.loan_date}</span></span>
                           <span className="text-[10px] font-medium text-slate-500/70">Due: {loan.due_date}</span>
                         </div>
                      </td>
                      <td className="p-5 pr-8 text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-sm ${
                            isReturned ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200/50' :
                            isOverdue ? 'bg-red-100/60 text-red-700 border-red-200/50' :
                            'bg-indigo-100/60 text-indigo-700 border-indigo-200/50'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

