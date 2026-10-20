import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  PiBookOpenText as FiBookOpen,
  PiClock as FiClock,
  PiCalendarCheck as FiCalendar,
  PiWarningCircle as FiAlert,
  PiCheckCircle as FiCheck,
  PiMagnifyingGlass as FiSearch,
  PiArrowsClockwise as FiRefresh,
  PiBookmark as FiBookmark,
  PiReceipt as FiReceipt,
  PiSealWarning as FiOverdue,
  PiWarningOctagon as FiIncident,
  PiX as FiX,
  PiChatCircleText as FiMessage,
  PiArrowRight as FiArrowRight,
} from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDateLocal(value) {
  if (!value) return null;
  const s = String(value).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fmtDate(value) {
  if (!value) return '—';
  const d = parseDateLocal(value);
  return !d || isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntilDue(dueDateStr) {
  const due = parseDateLocal(dueDateStr);
  if (!due) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86_400_000);
}

function getIncidentDisplayStatus(row) {
  if (!row.incident_status) return null;
  if (row.incident_status === 'Pending') {
    return {
      label: 'PENDING REVIEW',
      color: 'bg-amber-50/70 border-amber-200 text-amber-900',
      instruction: 'Circulation staff will review your report and determine next steps.',
    };
  }
  if (row.incident_status === 'Dismissed') {
    return {
      label: 'DISMISSED',
      color: 'bg-slate-50/80 border-slate-200 text-slate-800',
      instruction: 'Report was dismissed by library staff.',
    };
  }
  // If the book is not yet returned
  if (row.status !== 'Returned') {
    if (row.incident_action_taken === 'Replacement Required') {
      return {
        label: 'ACTION REQUIRED: REPLACEMENT NEEDED',
        color: 'bg-red-50/80 border-red-200 text-red-900',
        instruction: 'Please coordinate with the circulation desk to provide a replacement copy.',
      };
    }
    return {
      label: 'STAFF REVIEWED (RETURN PENDING)',
      color: 'bg-orange-50/80 border-orange-200 text-orange-900',
      instruction: 'No replacement copy required. Please return the book to the circulation desk.',
    };
  }
  // The book has been officially returned!
  return {
    label: 'RESOLVED',
    color: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
    instruction: 'Book returned / replaced successfully.',
  };
}

function StatusBadge({ status, daysOverdue, incidentStatus, incidentActionTaken }) {
  if (status === 'Returned') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100/70 text-emerald-700 border border-emerald-200/60 backdrop-blur-sm">
        <FiCheck size={11} /> Returned
      </span>
    );
  }

  if (incidentStatus === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100/80 text-amber-800 border border-amber-300 backdrop-blur-sm animate-pulse">
        <FiIncident size={11} /> Report Pending
      </span>
    );
  }

  if (incidentActionTaken === 'Replacement Required' || incidentStatus === 'Action Required') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100/80 text-red-800 border border-red-300 backdrop-blur-sm animate-pulse">
        <FiIncident size={11} /> Replacement Needed
      </span>
    );
  }

  if (status === 'Overdue' || daysOverdue > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100/70 text-red-700 border border-red-200/60 backdrop-blur-sm animate-pulse">
        <FiOverdue size={11} /> Overdue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100/70 text-blue-700 border border-blue-200/60 backdrop-blur-sm">
      <FiBookmark size={11} /> Active
    </span>
  );
}

function DueBadge({ dueDateStr, status }) {
  if (status === 'Returned') return <span className="text-xs text-slate-400 font-semibold">—</span>;
  const days = daysUntilDue(dueDateStr);
  if (days === null) return <span className="text-xs text-slate-400">—</span>;

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black text-red-600">
        <FiAlert size={13} /> {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600">
        <FiAlert size={13} /> Due today!
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
        <FiClock size={13} /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
      <FiCalendar size={13} /> {days}d left
    </span>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color, sub }) {
  const colorMap = {
    blue:    { bg: 'from-blue-500/10 to-blue-600/5',    icon: 'text-blue-500',   val: 'text-blue-700',   border: 'border-blue-200/50' },
    amber:   { bg: 'from-amber-500/10 to-amber-600/5',  icon: 'text-amber-500',  val: 'text-amber-700',  border: 'border-amber-200/50' },
    red:     { bg: 'from-red-500/10 to-red-600/5',      icon: 'text-red-500',    val: 'text-red-700',    border: 'border-red-200/50' },
    purple:  { bg: 'from-purple-500/10 to-purple-600/5', icon: 'text-purple-500', val: 'text-purple-700', border: 'border-purple-200/50' },
    emerald: { bg: 'from-emerald-500/10 to-emerald-600/5', icon: 'text-emerald-500', val: 'text-emerald-700', border: 'border-emerald-200/50' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} backdrop-blur-xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1">{label}</p>
          <p className={`text-3xl font-black ${c.val} leading-none`}>{value}</p>
          {sub && <p className="text-[10px] text-slate-400 font-semibold mt-1.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center ${c.icon} shadow-sm border border-white/60`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ── Report Issue Modal ────────────────────────────────────────────────────────

function ReportIssueModal({ loan, onClose, onSubmitted }) {
  const [incidentType, setIncidentType] = useState('Damaged');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const incidentTypes = [
    { value: 'Lost', label: 'Lost Book', desc: 'Book cannot be found or was misplaced' },
    { value: 'Torn', label: 'Torn Pages / Cover', desc: 'Pages, spine, or cover were ripped or detached' },
    { value: 'Damaged', label: 'Water / Spill / Physical Damage', desc: 'Stained, water-soaked, or physically marred' },
    { value: 'Other', label: 'Other Issue', desc: 'Any other condition or issue to report' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe what happened to the book.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/incidents', {
        transaction_id: loan.id,
        incident_type: incidentType,
        description: description.trim(),
      });
      toast.success('Incident reported successfully. Circulation staff will review it.');
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to file report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-[fadeInUp_0.2s_ease]">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <FiIncident size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Report Book Issue</h2>
              <p className="text-xs text-slate-500">Inform circulation staff about damage or loss</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Book Info */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Book Details</p>
            <p className="font-bold text-slate-800 text-sm">{loan.book_title}</p>
            <p className="text-slate-500 mt-0.5">{loan.book_author} {loan.book_barcode ? `· ${loan.book_barcode}` : ''}</p>
          </div>

          {/* Issue Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              What happened to the book? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {incidentTypes.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setIncidentType(item.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    incidentType === item.value
                      ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Explain What Happened <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details (e.g. spilled water during study session, lost in classroom 204, torn cover pages...)"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 leading-snug">
            <span className="font-bold">Notice:</span> Submitting this report will notify the circulation staff. They will review the case and determine if a replacement copy or other step is required.
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyBorrows() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'overdue' | 'reported' | 'returned'
  const [reportingLoan, setReportingLoan] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/my-borrows');
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load your borrow records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = records.filter(r => r.status !== 'Returned');
    const overdue = records.filter(r => r.status === 'Overdue' || (r.status !== 'Returned' && r.days_overdue > 0));
    const returned = records.filter(r => r.status === 'Returned');
    const reported = records.filter(r => r.incident_status === 'Pending' || r.incident_action_taken === 'Replacement Required');
    return { active: active.length, overdue: overdue.length, returned: returned.length, reported: reported.length };
  }, [records]);

  // ── Filtered + searched list ─────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = records;

    if (filter === 'active')   list = list.filter(r => r.status !== 'Returned' && r.days_overdue === 0);
    if (filter === 'overdue')  list = list.filter(r => r.status === 'Overdue' || (r.status !== 'Returned' && r.days_overdue > 0));
    if (filter === 'reported') list = list.filter(r => r.incident_status);
    if (filter === 'returned') list = list.filter(r => r.status === 'Returned');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.book_title?.toLowerCase().includes(q) ||
        r.book_author?.toLowerCase().includes(q) ||
        r.book_barcode?.toLowerCase().includes(q) ||
        r.book_category?.toLowerCase().includes(q) ||
        r.incident_type?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [records, filter, search]);

  const filterTabs = [
    { key: 'all',      label: 'All',      count: records.length },
    { key: 'active',   label: 'Active',   count: stats.active - stats.overdue },
    { key: 'overdue',  label: 'Overdue',  count: stats.overdue },
    { key: 'reported', label: 'Issues',   count: stats.reported },
    { key: 'returned', label: 'Returned', count: stats.returned },
  ];

  return (
    <div
      className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* ── Gradient background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#eef2ff] via-[#f0f9ff] to-[#f0fdf4] z-0" />
      <div className="absolute top-[-8%] right-[-4%] w-[32rem] h-[32rem] bg-indigo-300/25 rounded-full mix-blend-multiply filter blur-[110px] z-0" />
      <div className="absolute top-[40%] left-[-8%] w-[28rem] h-[28rem] bg-sky-300/20 rounded-full mix-blend-multiply filter blur-[90px] z-0" />
      <div className="absolute bottom-[-10%] right-[15%] w-[36rem] h-[36rem] bg-teal-200/25 rounded-full mix-blend-multiply filter blur-[130px] z-0" />

      <div className="relative z-10 max-w-[1400px] w-full mx-auto flex-1 flex flex-col gap-7">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-sm flex items-center justify-center text-indigo-600">
                <FiBookOpen size={22} />
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-indigo-950 tracking-tight drop-shadow-sm">
                My Borrowed Books
              </h1>
            </div>
            <p className="text-sm text-indigo-900/55 font-semibold ml-1">
              Logged in as <span className="text-indigo-700">{user?.username}</span> · {user?.user_id}
            </p>
          </div>

          <button
            id="my-borrows-refresh"
            onClick={load}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/50 border border-white/70 text-indigo-700 hover:bg-white/80 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm text-sm font-bold backdrop-blur-md disabled:opacity-60"
          >
            <FiRefresh size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Active Loans"
            value={stats.active}
            icon={FiBookmark}
            color="blue"
            sub="currently borrowed"
          />
          <SummaryCard
            label="Overdue"
            value={stats.overdue}
            icon={FiOverdue}
            color="red"
            sub={stats.overdue > 0 ? 'return to library' : 'all on time'}
          />
          <SummaryCard
            label="Book Issues"
            value={stats.reported}
            icon={FiIncident}
            color={stats.reported > 0 ? 'amber' : 'purple'}
            sub={stats.reported > 0 ? 'action required/pending' : 'no active reports'}
          />
          <SummaryCard
            label="Returned"
            value={stats.returned}
            icon={FiCheck}
            color="emerald"
            sub="books returned"
          />
        </div>

        {/* ── Action Required Alert Banner (if replacement needed) ── */}
        {records.some(r => r.incident_action_taken === 'Replacement Required' && r.status !== 'Returned') && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-orange-50/90 border border-orange-200 backdrop-blur-sm shadow-sm">
            <FiIncident size={22} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-orange-950">
                Action Required: Book Replacement
              </p>
              <p className="text-orange-900/80 mt-0.5 leading-snug">
                Circulation staff reviewed your reported book and confirmed that a replacement copy is required. Please visit the circulation desk to coordinate replacement steps.
              </p>
            </div>
          </div>
        )}

        {/* ── Overdue alert banner ── */}
        {stats.overdue > 0 && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-red-50/80 border border-red-200/60 backdrop-blur-sm shadow-sm">
            <FiAlert size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-800 leading-snug">
              You have <span className="font-black">{stats.overdue}</span> overdue {stats.overdue === 1 ? 'book' : 'books'}.
              Please return {stats.overdue === 1 ? 'it' : 'them'} to the library circulation desk.
            </p>
          </div>
        )}

        {/* ── Filter tabs + Search ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl p-1 shadow-sm flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                id={`my-borrows-filter-${tab.key}`}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.key
                    ? 'bg-white shadow-sm text-indigo-700 border border-indigo-100'
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
                  filter === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" size={15} />
            <input
              id="my-borrows-search"
              type="text"
              className="w-full bg-white/50 border border-white/70 focus:bg-white/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-indigo-950 placeholder:text-indigo-900/40 outline-none transition-all shadow-sm backdrop-blur-md"
              placeholder="Search title, author, issue…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Records List ── */}
        <div className="flex-1">
          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/30 backdrop-blur-xl border border-white/60 rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-16 bg-indigo-100/60 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-indigo-100/60 rounded-lg w-2/3" />
                      <div className="h-3 bg-indigo-100/40 rounded-lg w-1/3" />
                      <div className="h-3 bg-indigo-100/30 rounded-lg w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-24 h-24 rounded-3xl bg-white/50 backdrop-blur-md border border-white/70 shadow-md flex items-center justify-center text-indigo-300">
                <FiBookOpen size={40} />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-indigo-950 tracking-tight">
                  {records.length === 0 ? 'No Borrows Yet' : 'No Records Match'}
                </p>
                <p className="text-sm text-indigo-900/50 font-medium mt-1 max-w-xs">
                  {records.length === 0
                    ? 'You have not borrowed any library materials yet.'
                    : 'Try adjusting your filter or search query.'}
                </p>
              </div>
              {search || filter !== 'all' ? (
                <button
                  onClick={() => { setSearch(''); setFilter('all'); }}
                  className="px-5 py-2 rounded-xl bg-white/60 border border-white/70 text-indigo-600 hover:bg-white/80 transition-all text-sm font-bold shadow-sm"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              {visible.map((row) => {
                const isOverdue = row.status !== 'Returned' && row.days_overdue > 0;
                const isActive  = row.status !== 'Returned' && row.days_overdue === 0;
                const hasPendingIncident = row.incident_status === 'Pending';
                const hasResolvedIncident = row.incident_status === 'Resolved';
                const replacementRequired = row.incident_action_taken === 'Replacement Required';

                return (
                  <div
                    key={row.id}
                    id={`borrow-record-${row.id}`}
                    className={`group relative bg-white/40 backdrop-blur-xl border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden
                      ${replacementRequired ? 'border-orange-300 bg-orange-50/20' : hasPendingIncident ? 'border-amber-300 bg-amber-50/20' : isOverdue ? 'border-red-200/70' : isActive ? 'border-blue-200/50' : 'border-white/60'}`}
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl
                      ${replacementRequired ? 'bg-gradient-to-b from-orange-500 to-amber-600' : hasPendingIncident ? 'bg-gradient-to-b from-amber-400 to-yellow-500' : isOverdue ? 'bg-gradient-to-b from-red-400 to-rose-500' : isActive ? 'bg-gradient-to-b from-blue-400 to-indigo-500' : 'bg-gradient-to-b from-emerald-400 to-teal-500'}`}
                    />

                    <div className="pl-3 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: Book details */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border
                            ${replacementRequired ? 'bg-orange-100 border-orange-200 text-orange-600' : hasPendingIncident ? 'bg-amber-100 border-amber-200 text-amber-600' : isOverdue ? 'bg-red-50/80 border-red-100 text-red-400' : isActive ? 'bg-blue-50/80 border-blue-100 text-blue-400' : 'bg-emerald-50/80 border-emerald-100 text-emerald-400'}`}>
                            <FiBookOpen size={22} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-2 mb-1">
                              <h3 className="font-black text-indigo-950 text-sm leading-snug line-clamp-2 flex-1">
                                {row.book_title || 'Unknown Title'}
                              </h3>
                              <StatusBadge
                                status={row.status}
                                daysOverdue={row.days_overdue}
                                incidentStatus={row.incident_status}
                                incidentActionTaken={row.incident_action_taken}
                              />
                            </div>
                            <p className="text-xs text-indigo-800/60 font-semibold">
                              {row.book_author || 'Unknown Author'}
                              {row.book_category ? <span className="ml-2 text-indigo-400">· {row.book_category}</span> : null}
                            </p>
                            {row.book_barcode && (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                Barcode: {row.book_barcode}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Dates + Actions */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:text-right flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Due Date</p>
                            <p className="text-xs font-bold text-slate-700">{fmtDate(row.due_date)}</p>
                            <div className="mt-0.5">
                              <DueBadge dueDateStr={row.due_date} status={row.status} />
                            </div>
                          </div>

                          {/* Report Issue Button (if active and no pending report) */}
                          {row.status !== 'Returned' && !hasPendingIncident && (
                            <button
                              onClick={() => setReportingLoan(row)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition text-xs font-bold shadow-sm"
                            >
                              <FiIncident size={13} />
                              Report Issue
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Incident Callout / Notification Details */}
                      {row.incident_status && (() => {
                        const disp = getIncidentDisplayStatus(row);
                        if (!disp) return null;
                        return (
                          <div className={`mt-1 p-3.5 rounded-xl border text-xs flex flex-col gap-1.5 ${disp.color}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <FiIncident size={12} />
                                Reported Issue: {row.incident_type} ({disp.label})
                              </span>
                              <span className="text-[10px] opacity-75">{fmtDate(row.incident_created_at)}</span>
                            </div>

                            {row.incident_description && (
                              <p className="italic opacity-90 text-[11px]">
                                Your note: &ldquo;{row.incident_description}&rdquo;
                              </p>
                            )}

                            {row.incident_action_taken && (
                              <div className="mt-1 pt-1.5 border-t border-current/15 flex flex-col gap-0.5">
                                <p className="font-bold text-xs">
                                  Circulation Staff Decision: <span className="underline">{row.incident_action_taken}</span>
                                </p>
                                {row.incident_staff_notes && (
                                  <p className="text-[11px] opacity-90">
                                    Remarks: {row.incident_staff_notes}
                                  </p>
                                )}
                                {disp.instruction && (
                                  <p className="text-[10px] font-semibold opacity-85 mt-0.5">
                                    Next Step: {disp.instruction}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer hint ── */}
        <p className="text-center text-[11px] text-slate-400 font-semibold pb-2">
          <FiReceipt size={11} className="inline mr-1 mb-0.5" />
          If a borrowed book is lost, torn, or damaged, use &ldquo;Report Issue&rdquo; so circulation staff can guide you.
        </p>
      </div>

      {/* ── Report Issue Modal ── */}
      {reportingLoan && (
        <ReportIssueModal
          loan={reportingLoan}
          onClose={() => setReportingLoan(null)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}
