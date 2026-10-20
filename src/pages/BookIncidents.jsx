import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  PiWarningOctagon as FiIncident,
  PiMagnifyingGlass as FiSearch,
  PiArrowsClockwise as FiRefresh,
  PiCheckCircle as FiCheck,
  PiXCircle as FiDismiss,
  PiBookOpenText as FiBook,
  PiUser as FiUser,
  PiClock as FiClock,
  PiSealWarning as FiWarning,
  PiNote as FiNote,
  PiCaretDown as FiChevron,
  PiEmpty as FiEmpty,
} from 'react-icons/pi';

const INCIDENT_COLORS = {
  Lost:    { bg: 'bg-red-100/80',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500' },
  Torn:    { bg: 'bg-orange-100/80', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  Damaged: { bg: 'bg-amber-100/80',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
  Other:   { bg: 'bg-purple-100/80', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
};

const STATUS_STYLE = {
  Pending:           { bg: 'bg-yellow-100/80', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Pending Review' },
  'Action Required': { bg: 'bg-orange-100/80', text: 'text-orange-800', border: 'border-orange-300', label: 'Action Required' },
  Resolved:          { bg: 'bg-emerald-100/80', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Resolved (Returned)' },
  Dismissed:         { bg: 'bg-slate-100/80', text: 'text-slate-600', border: 'border-slate-200', label: 'Dismissed' },
};

function fmtDate(v) {
  if (!v) return '—';
  const s = String(v).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(v) {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Resolve Modal ─────────────────────────────────────────────────────────────
function ResolveModal({ report, onClose, onResolved }) {
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const actions = [
    { value: 'Replacement Required', label: 'Replacement Required', desc: 'Borrower must replace the book with an equivalent copy.', color: 'border-red-300 bg-red-50 text-red-800' },
    { value: 'No Action Needed',     label: 'No Action Needed',     desc: 'The book condition is acceptable; no further action required.', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
    { value: 'Dismissed',            label: 'Dismiss Report',       desc: 'The report is invalid or filed in error.', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  ];

  const handleSubmit = async () => {
    if (!action) { toast.error('Please select an action'); return; }
    setSubmitting(true);
    try {
      await api.patch(`/incidents/${report.id}/resolve`, { action_taken: action, staff_notes: notes });
      toast.success('Incident report resolved');
      onResolved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resolve report');
    } finally {
      setSubmitting(false);
    }
  };

  const incidentColor = INCIDENT_COLORS[report.incident_type] || INCIDENT_COLORS.Other;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeInUp_0.25s_ease]">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${incidentColor.bg} border ${incidentColor.border}`}>
              <FiWarning size={22} className={incidentColor.text} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-slate-900">Resolve Incident Report</h2>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                <span className={`font-semibold ${incidentColor.text}`}>{report.incident_type}</span>
                {' · '}{report.book_title}
              </p>
            </div>
          </div>

          {/* Report summary */}
          <div className="mt-4 bg-slate-50 rounded-2xl p-4 text-sm space-y-1.5">
            <div className="flex gap-2">
              <span className="text-slate-400 w-20 flex-shrink-0">Borrower</span>
              <span className="text-slate-800 font-semibold">{report.borrower_name} <span className="font-normal text-slate-500">({report.borrower_id_no})</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-400 w-20 flex-shrink-0">Book</span>
              <span className="text-slate-800 font-semibold">{report.book_title}</span>
            </div>
            {report.description && (
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0">Details</span>
                <span className="text-slate-700 italic">&ldquo;{report.description}&rdquo;</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-slate-400 w-20 flex-shrink-0">Reported</span>
              <span className="text-slate-700">{fmtDateTime(report.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-5 space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-700 mb-2.5">Select Action <span className="text-red-500">*</span></p>
            <div className="space-y-2">
              {actions.map((a) => (
                <label key={a.value} className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${action === a.value ? a.color + ' border-opacity-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <input
                    type="radio"
                    name="action"
                    value={a.value}
                    checked={action === a.value}
                    onChange={() => setAction(a.value)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-bold">{a.label}</p>
                    <p className="text-xs mt-0.5 opacity-75">{a.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">Staff Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any remarks or instructions for the borrower…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !action}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-blue-500/20"
          >
            {submitting ? 'Saving…' : 'Confirm Resolution'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Incident Card ─────────────────────────────────────────────────────────────
function IncidentCard({ report, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const incidentColor = INCIDENT_COLORS[report.incident_type] || INCIDENT_COLORS.Other;
  const statusStyle = STATUS_STYLE[report.status] || STATUS_STYLE.Pending;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Top stripe by type */}
      <div className={`h-1 w-full ${incidentColor.dot}`} />

      <div className="p-5">
        {/* Row 1: Badges + action */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${incidentColor.bg} ${incidentColor.text} ${incidentColor.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${incidentColor.dot} flex-shrink-0`} />
              {report.incident_type}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {statusStyle.label}
            </span>
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">{fmtDateTime(report.created_at)}</span>
        </div>

        {/* Row 2: Book + Borrower */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 mb-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <FiBook size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">{report.book_title}</p>
              <p className="text-xs text-slate-500 truncate">{report.book_author} · {report.book_barcode}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <FiUser size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{report.borrower_name}</p>
              <p className="text-xs text-slate-500">{report.borrower_id_no}</p>
            </div>
          </div>
        </div>

        {/* Description preview */}
        {report.description && (
          <p className="text-xs text-slate-600 italic bg-slate-50 rounded-lg px-3 py-2 mb-3 line-clamp-2">
            &ldquo;{report.description}&rdquo;
          </p>
        )}

        {/* Expandable resolved info */}
        {report.status !== 'Pending' && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition mb-2"
            >
              <FiChevron size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              {expanded ? 'Hide' : 'Show'} resolution details
            </button>
            {expanded && (
              <div className="bg-slate-50 rounded-xl p-3.5 text-xs space-y-1.5 border border-slate-100">
                <div className="flex gap-2">
                  <span className="text-slate-400 w-24">Action Taken</span>
                  <span className="font-semibold text-slate-800">{report.action_taken || '—'}</span>
                </div>
                {report.staff_notes && (
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-24">Staff Notes</span>
                    <span className="text-slate-700 italic">{report.staff_notes}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-slate-400 w-24">Resolved</span>
                  <span className="text-slate-700">{fmtDateTime(report.resolved_at)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        {report.status === 'Pending' && (
          <button
            onClick={() => onResolve(report)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20"
          >
            <FiCheck size={15} />
            Take Action
          </button>
        )}
        {report.status === 'Action Required' && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onResolve(report)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Update Decision
            </button>
            <span className="text-[10px] text-amber-700 font-semibold self-center">
              Awaiting return at Check-in
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookIncidents() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [resolving, setResolving] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/incidents', { params });
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load incident reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, [filterStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadReports();
  };

  const counts = {
    Pending: reports.filter(r => r.status === 'Pending').length,
    ActionRequired: reports.filter(r => r.status === 'Action Required').length,
  };

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fef9f0] via-[#fff8f1] to-[#f0f4ff] z-0" />
      <div className="absolute top-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-orange-200/25 rounded-full mix-blend-multiply filter blur-[120px] z-0" />
      <div className="absolute top-[35%] left-[-8%] w-[30rem] h-[30rem] bg-amber-200/20 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-15%] right-[15%] w-[40rem] h-[40rem] bg-blue-200/20 rounded-full mix-blend-multiply filter blur-[150px] z-0" />

      <div className="relative z-10 max-w-[1400px] w-full mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 drop-shadow-sm">
              <span className="p-2.5 bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 text-orange-500">
                <FiIncident size={26} />
              </span>
              Book Incidents
            </h1>
            <p className="text-slate-500 mt-1.5 ml-1 text-sm">Manage lost, torn, and damaged book reports from borrowers</p>
          </div>
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-md border border-white/60 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white/90 hover:shadow-md transition-all"
          >
            <FiRefresh size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Reports', value: reports.length, color: 'text-slate-700', bg: 'bg-white/70' },
            { label: 'Pending Review', value: reports.filter(r => r.status === 'Pending').length, color: 'text-yellow-700', bg: 'bg-yellow-50/80' },
            { label: 'Action Required', value: reports.filter(r => r.status === 'Action Required').length, color: 'text-orange-700', bg: 'bg-orange-50/80' },
            { label: 'Resolved (Returned)', value: reports.filter(r => r.status === 'Resolved').length, color: 'text-emerald-700', bg: 'bg-emerald-50/80' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Status tabs */}
          <div className="flex gap-1.5 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl p-1 shadow-sm flex-wrap">
            {[
              { label: 'Pending', value: 'Pending' },
              { label: 'Action Required', value: 'Action Required' },
              { label: 'Resolved', value: 'Resolved' },
              { label: 'Dismissed', value: 'Dismissed' },
              { label: 'All', value: '' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterStatus === tab.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                {tab.label}
                {tab.value === 'Pending' && counts.Pending > 0 && (
                  <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${filterStatus === 'Pending' ? 'bg-white/30 text-white' : 'bg-red-100 text-red-600'}`}>
                    {counts.Pending}
                  </span>
                )}
                {tab.value === 'Action Required' && counts.ActionRequired > 0 && (
                  <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${filterStatus === 'Action Required' ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-700'}`}>
                    {counts.ActionRequired}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm ml-auto">
            <div className="relative flex-1">
              <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search borrower, book…"
                className="w-full pl-9 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
            >
              Search
            </button>
          </form>
        </div>

        {/* Reports grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-4 border border-orange-100">
              <FiEmpty size={36} className="text-orange-300" />
            </div>
            <p className="text-lg font-bold text-slate-700">No incident reports found</p>
            <p className="text-sm text-slate-400 mt-1">
              {filterStatus ? `No ${filterStatus.toLowerCase()} reports at the moment.` : 'No reports have been filed yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((r) => (
              <IncidentCard key={r.id} report={r} onResolve={setResolving} />
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {resolving && (
        <ResolveModal
          report={resolving}
          onClose={() => setResolving(null)}
          onResolved={loadReports}
        />
      )}
    </div>
  );
}
