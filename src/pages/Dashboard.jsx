import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  FiBook, FiUsers, FiArrowRightCircle, FiAlertTriangle,
  FiCalendar, FiTruck, FiCheckCircle, FiDollarSign, FiTrendingUp, FiRefreshCw,
} from 'react-icons/fi';

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
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden ${
        visible ? 'anim-fade-up' : 'opacity-0'
      }`}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: cfg.gradient }} />

      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
          <cfg.icon size={20} style={{ color: cfg.accent }} />
        </div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50">
          <FiTrendingUp size={12} className="text-gray-300" />
        </div>
      </div>

      <p className="text-2xl font-black text-gray-900 leading-none mb-1">{displayValue}</p>
      <p className="text-xs font-medium text-gray-400">{cfg.label}</p>
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
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Library overview and recent activity</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
        >
          <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statConfigs.map((cfg, i) => (
          <StatCard key={cfg.key} cfg={cfg} value={statValues[cfg.key]} index={i} />
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest loan activity</p>
          </div>
          <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
            {stats.recentLoans.length} records
          </span>
        </div>

        {stats.recentLoans.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <FiBook size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-medium">No transactions yet</p>
            <p className="text-gray-300 text-xs mt-1">Checked-out books will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Borrower</th>
                  <th>Loan Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLoans.map((loan) => {
                  const s = statusStyle[loan.status] || { bg: '#f1f5f9', color: '#475569' };
                  return (
                    <tr key={loan.id}>
                      <td>
                        <span className="font-semibold text-gray-900">{loan.book_title}</span>
                      </td>
                      <td className="text-gray-600">{loan.borrower_name}</td>
                      <td className="text-gray-500">{loan.loan_date}</td>
                      <td className="text-gray-500">{loan.due_date}</td>
                      <td>
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: s.bg, color: s.color }}
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
  );
}

