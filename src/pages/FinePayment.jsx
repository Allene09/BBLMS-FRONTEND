import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  PiCashRegister as FiCashRegister,
  PiMagnifyingGlass as FiSearch,
  PiReceiptX as FiReceiptX,
  PiCheckCircle as FiCheckCircle,
  PiArrowLeft as FiArrowLeft,
  PiUser as FiUser,
  PiBook as FiBook,
  PiClock as FiClock,
  PiMoney as FiMoney,
  PiWarningCircle as FiAlertCircle,
  PiListBullets as FiList,
  PiX as FiX,
  PiPrinter as FiPrinter,
  PiCalendarBlank as FiCalendar,
  PiReceipt as FiReceipt,
} from 'react-icons/pi';

// ── Utilities ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ── Payment Modal ──────────────────────────────────────────────────────────────
function PaymentModal({ fine, onClose, onSuccess }) {
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const fineAmt = Number(fine.total_fine || 0);
  const paid    = parseFloat(amountPaid) || 0;
  const change  = parseFloat((paid - fineAmt).toFixed(2));
  const isShort = paid > 0 && paid < fineAmt;
  const isExact = paid >= fineAmt;

  const handlePay = async () => {
    if (!isExact) return;
    setProcessing(true);
    try {
      const res = await api.post('/fines/pay', {
        transaction_id: fine.transaction_id,
        amount_paid: paid,
        notes: notes.trim() || undefined,
      });
      setReceipt(res.data);
      onSuccess();
      toast.success(`Payment recorded — ${res.data.receipt_no}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  // ── Receipt view ─────────────────────────────────────────────────────────────
  if (receipt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeInUp_0.3s_ease]">
          {/* Receipt Header */}
          <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <FiCheckCircle size={36} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Payment Successful</h2>
            <p className="text-sm text-emerald-100 mt-1 font-medium">{receipt.receipt_no}</p>
          </div>

          {/* Receipt Body */}
          <div className="p-6 space-y-3 text-sm">
            <Row label="Borrower"   value={receipt.borrower_name} />
            <Row label="Borrower ID" value={receipt.borrower_id_no} />
            <Row label="Book"       value={receipt.book_title} />
            <Row label="Return Date" value={fmtDate(receipt.return_date)} />
            <div className="border-t border-dashed border-gray-200 my-3" />
            <Row label="Fine Amount"  value={`PHP ${fmt(receipt.fine_amount)}`} bold />
            <Row label="Cash Received" value={`PHP ${fmt(receipt.amount_paid)}`} />
            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <span className="font-black text-amber-800 text-base">Change</span>
              <span className="font-black text-amber-700 text-xl">PHP {fmt(receipt.change_given)}</span>
            </div>
            <Row label="Payment Type" value={receipt.payment_type} />
            <Row label="Received By" value={receipt.received_by_user_id} />
            <Row label="Date & Time"  value={new Date(receipt.paid_at).toLocaleString('en-PH')} />
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
            >
              <FiPrinter size={18} /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Form view ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeInUp_0.3s_ease]">
        {/* Modal Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
              <FiCashRegister size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base tracking-tight">Process Fine Payment</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Walk-in cash transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Borrower & Book Info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<FiUser size={14} className="text-blue-500" />} label="Borrower">
              <p className="font-bold text-gray-900 text-sm leading-tight">{fine.borrower_name}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{fine.borrower_id_no}</p>
            </InfoCard>
            <InfoCard icon={<FiBook size={14} className="text-purple-500" />} label="Book">
              <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{fine.book_title}</p>
            </InfoCard>
          </div>

          {/* Fine amount display */}
          <div className="rounded-2xl p-4 border border-red-100" style={{ background: 'linear-gradient(135deg, #fff1f2, #fff5f5)' }}>
            <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Total Fine Due</p>
            <p className="text-4xl font-black text-red-600 tracking-tight">PHP {fmt(fineAmt)}</p>
            <div className="flex gap-4 mt-2 text-xs text-red-400 font-semibold">
              <span className="flex items-center gap-1"><FiClock size={11} /> Due: {fmtDate(fine.due_date)}</span>
              <span className="flex items-center gap-1"><FiCalendar size={11} /> Returned: {fmtDate(fine.return_date)}</span>
            </div>
          </div>

          {/* Payment Type (locked to Cash) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Payment Type</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50">
              <FiMoney size={18} className="text-emerald-600" />
              <span className="font-black text-emerald-800 text-sm">Cash</span>
              <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">Walk-in Only</span>
            </div>
          </div>

          {/* Cash Received Input */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
              Cash Received (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-gray-400">₱</span>
              <input
                type="number"
                min={fineAmt}
                step="0.01"
                placeholder={`Min. ${fmt(fineAmt)}`}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className={`w-full pl-9 pr-4 py-3.5 rounded-2xl border-2 font-black text-xl outline-none transition-all
                  ${isShort
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-4 focus:ring-red-100'
                    : isExact
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:ring-4 focus:ring-emerald-100'
                    : 'border-gray-200 bg-gray-50 text-gray-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
                  }`}
              />
            </div>
            {isShort && (
              <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
                <FiAlertCircle size={13} /> PHP {fmt(fineAmt - paid)} short — please collect the full amount
              </p>
            )}
          </div>

          {/* Change Display */}
          <div className={`rounded-2xl p-4 border-2 transition-all duration-300
            ${change > 0 && isExact
              ? 'border-amber-400 bg-amber-50'
              : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Change to Return</p>
                <p className={`text-3xl font-black mt-1 transition-all duration-200
                  ${change > 0 && isExact ? 'text-amber-600' : 'text-gray-300'}`}>
                  PHP {change >= 0 && paid > 0 ? fmt(change) : '0.00'}
                </p>
              </div>
              {change > 0 && isExact && (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <FiMoney size={22} className="text-white" />
                </div>
              )}
              {change === 0 && isExact && (
                <div className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                  Exact Change ✓
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Any remarks about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 font-medium text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none transition-all"
            />
          </div>

          {/* Submit */}
          <button
            disabled={!isExact || processing}
            onClick={handlePay}
            className={`w-full py-4 rounded-2xl font-black text-base text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg
              ${isExact && !processing
                ? 'shadow-emerald-400/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0'
                : 'opacity-40 cursor-not-allowed shadow-none'}`}
            style={isExact && !processing ? { background: 'linear-gradient(135deg, #059669, #0d9488)' } : { background: '#9ca3af' }}
          >
            {processing ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : (
              <><FiCheckCircle size={22} /> Confirm Payment</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────────
function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-gray-500 font-semibold text-xs flex-shrink-0 w-28">{label}</span>
      <span className={`text-right text-xs ${bold ? 'font-black text-gray-900 text-sm' : 'font-semibold text-gray-700'}`}>{value}</span>
    </div>
  );
}

function InfoCard({ icon, label, children }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      {children}
    </div>
  );
}

// ── Main FinePayment Page ─────────────────────────────────────────────────────
export default function FinePayment() {
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('process'); // 'process' | 'history'

  // Process tab state
  const [search, setSearch]       = useState('');
  const [unpaid, setUnpaid]       = useState([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);
  const [selectedFine, setSelectedFine]   = useState(null);

  // History tab state
  const [hSearch, setHSearch]       = useState('');
  const [payments, setPayments]     = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Data loaders ─────────────────────────────────────────────────────────────
  const loadUnpaid = useCallback(async (q = '') => {
    setLoadingUnpaid(true);
    try {
      const res = await api.get('/fines/unpaid', { params: { search: q } });
      setUnpaid(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load unpaid fines');
    } finally {
      setLoadingUnpaid(false);
    }
  }, []);

  const loadHistory = useCallback(async (q = '') => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/fines/payments', { params: { search: q } });
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadUnpaid(); loadHistory(); }, [loadUnpaid, loadHistory]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => loadUnpaid(search), 300);
    return () => clearTimeout(t);
  }, [search, loadUnpaid]);

  useEffect(() => {
    const t = setTimeout(() => loadHistory(hSearch), 300);
    return () => clearTimeout(t);
  }, [hSearch, loadHistory]);

  const handlePaymentSuccess = () => {
    loadUnpaid(search);
    loadHistory(hSearch);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Gradient background */}
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 40%, #eff6ff 100%)' }} />
      <div className="absolute top-[-10%] right-[-5%] w-[35rem] h-[35rem] rounded-full z-0" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-15%] left-[10%] w-[40rem] h-[40rem] rounded-full z-0" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">

        {/* ── Page Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 drop-shadow-sm" style={{ color: '#064e3b' }}>
              <span className="p-2.5 rounded-2xl shadow-sm border border-white/50" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', color: '#059669' }}>
                <FiCashRegister size={28} />
              </span>
              Fine Payments
            </h1>
            <p className="text-sm lg:text-base font-semibold mt-2 ml-1" style={{ color: 'rgba(6,78,59,0.6)' }}>
              Walk-in cash fine collection · {user?.username}
            </p>
          </div>

          {/* Summary badges */}
          <div className="flex gap-3 flex-wrap">
            <StatBadge label="Unpaid Fines" value={unpaid.length} color="#dc2626" bg="#fff1f2" />
            <StatBadge label="Collected Today" value={payments.filter(p => new Date(p.paid_at).toDateString() === new Date().toDateString()).length} color="#059669" bg="#ecfdf5" />
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'process', label: 'Process Payment', icon: FiCashRegister },
            { key: 'history', label: 'Payment History', icon: FiList },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all duration-200
                ${activeTab === key
                  ? 'text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-600 hover:text-gray-900'}`}
              style={activeTab === key
                ? { background: 'linear-gradient(135deg, #059669, #0d9488)' }
                : { background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)' }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Process Payment Tab ───────────────────────────────────────────────── */}
        {activeTab === 'process' && (
          <>
            {/* Search */}
            <div className="mb-5 rounded-3xl p-4 shadow-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ml-1" style={{ color: 'rgba(6,78,59,0.6)' }}>Search Unpaid Fines</label>
              <div className="relative max-w-3xl">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3 rounded-2xl font-medium text-base outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', color: '#064e3b' }}
                  placeholder="Borrower name, ID No, book title, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 rounded-[2rem] overflow-hidden flex flex-col shadow-lg relative"
              style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.6)' }}>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
                      {['Borrower', 'Book', 'Return Date', 'Days Overdue', 'Fine Amount', 'Action'].map((h, i) => (
                        <th key={i} className="p-5 text-[11px] font-black uppercase tracking-[0.2em] sticky top-0 z-20"
                          style={{ color: 'rgba(6,78,59,0.7)', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUnpaid ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <div className="inline-flex flex-col items-center gap-3">
                            <FiSearch size={32} className="animate-pulse text-emerald-500" />
                            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'rgba(6,78,59,0.5)' }}>Loading unpaid fines...</span>
                          </div>
                        </td>
                      </tr>
                    ) : unpaid.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-24 text-center">
                          <div className="inline-flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 8px 32px rgba(5,150,105,0.1)' }}>
                              <FiReceiptX size={36} style={{ color: '#6ee7b7' }} />
                            </div>
                            <span className="text-base font-extrabold tracking-tight" style={{ color: '#064e3b' }}>No Unpaid Fines</span>
                            <span className="text-sm font-medium max-w-sm leading-relaxed" style={{ color: 'rgba(6,78,59,0.6)' }}>
                              All fines have been settled, or no results match your search.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : unpaid.map((fine) => {
                      const overdue = Math.max(0, fine.days_overdue || 0);
                      return (
                        <tr key={fine.transaction_id}
                          className="group transition-colors duration-150"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.4)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                          {/* Borrower */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-emerald-800 flex-shrink-0 shadow-sm border border-white/60 group-hover:scale-105 transition-transform"
                                style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                                {fine.borrower_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm" style={{ color: '#064e3b' }}>{fine.borrower_name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(6,78,59,0.5)' }}>{fine.borrower_id_no}</p>
                              </div>
                            </div>
                          </td>

                          {/* Book */}
                          <td className="p-4">
                            <p className="font-bold text-sm leading-snug line-clamp-2" style={{ color: '#064e3b' }}>{fine.book_title}</p>
                            <p className="text-[11px] font-semibold mt-0.5 truncate max-w-[200px]" style={{ color: 'rgba(6,78,59,0.5)' }}>{fine.book_author || 'Unknown Author'}</p>
                          </td>

                          {/* Return date */}
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm"
                              style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.7)', color: 'rgba(6,78,59,0.8)' }}>
                              {fmtDate(fine.return_date)}
                            </span>
                          </td>

                          {/* Days overdue */}
                          <td className="p-4">
                            {overdue > 0 ? (
                              <div className="inline-flex flex-col items-center justify-center p-2 rounded-xl min-w-[3rem]"
                                style={{ background: 'rgba(254,226,226,0.6)', border: '1px solid rgba(252,165,165,0.4)' }}>
                                <span className="font-black text-red-600 text-base leading-none">{overdue}</span>
                                <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">days</span>
                              </div>
                            ) : (
                              <span className="font-bold text-xl" style={{ color: 'rgba(6,78,59,0.2)' }}>—</span>
                            )}
                          </td>

                          {/* Fine amount */}
                          <td className="p-4">
                            <div className="inline-flex items-end gap-1 px-3 py-1.5 rounded-xl"
                              style={{ background: 'rgba(254,226,226,0.6)', border: '1px solid rgba(252,165,165,0.3)' }}>
                              <span className="text-[9px] font-black uppercase text-red-400 mb-0.5">PHP</span>
                              <span className="font-black text-red-600 text-lg leading-none">{fmt(fine.total_fine)}</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedFine(fine)}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 w-full text-xs font-black text-white rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border border-emerald-400 active:translate-y-0"
                              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}
                            >
                              <FiCashRegister size={15} />
                              Pay Fine
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Payment History Tab ───────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <>
            {/* Search */}
            <div className="mb-5 rounded-3xl p-4 shadow-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ml-1" style={{ color: 'rgba(6,78,59,0.6)' }}>Search Payment History</label>
              <div className="relative max-w-3xl">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3 rounded-2xl font-medium text-base outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', color: '#064e3b' }}
                  placeholder="Receipt No., borrower name, ID No., book title..."
                  value={hSearch}
                  onChange={(e) => setHSearch(e.target.value)}
                />
              </div>
            </div>

            {/* History Table */}
            <div className="flex-1 rounded-[2rem] overflow-hidden flex flex-col shadow-lg"
              style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.6)' }}>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
                      {['Receipt No.', 'Borrower', 'Book', 'Fine', 'Cash Paid', 'Change', 'Cashier', 'Date & Time'].map((h, i) => (
                        <th key={i} className="p-5 text-[11px] font-black uppercase tracking-[0.2em] sticky top-0 z-20"
                          style={{ color: 'rgba(6,78,59,0.7)', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <div className="inline-flex flex-col items-center gap-3">
                            <FiList size={32} className="animate-pulse text-emerald-500" />
                            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'rgba(6,78,59,0.5)' }}>Loading history...</span>
                          </div>
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center">
                          <div className="inline-flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)' }}>
                              <FiReceipt size={36} style={{ color: '#6ee7b7' }} />
                            </div>
                            <span className="text-base font-extrabold tracking-tight" style={{ color: '#064e3b' }}>No Payment Records</span>
                            <span className="text-sm font-medium" style={{ color: 'rgba(6,78,59,0.6)' }}>No payments have been processed yet.</span>
                          </div>
                        </td>
                      </tr>
                    ) : payments.map((p) => (
                      <tr key={p.id}
                        className="group transition-colors duration-150"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.4)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                        {/* Receipt No */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase"
                            style={{ background: 'rgba(209,250,229,0.6)', border: '1px solid rgba(167,243,208,0.4)', color: '#065f46' }}>
                            <FiReceipt size={11} />
                            {p.receipt_no}
                          </span>
                        </td>

                        {/* Borrower */}
                        <td className="p-4">
                          <p className="font-bold text-sm" style={{ color: '#064e3b' }}>{p.borrower_name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(6,78,59,0.5)' }}>{p.borrower_id_no}</p>
                        </td>

                        {/* Book */}
                        <td className="p-4 max-w-[220px]">
                          <p className="font-bold text-sm line-clamp-2" style={{ color: '#064e3b' }}>{p.book_title}</p>
                        </td>

                        {/* Fine */}
                        <td className="p-4">
                          <span className="font-black text-red-600 text-sm">PHP {fmt(p.fine_amount)}</span>
                        </td>

                        {/* Cash Paid */}
                        <td className="p-4">
                          <span className="font-black text-sm" style={{ color: '#064e3b' }}>PHP {fmt(p.amount_paid)}</span>
                        </td>

                        {/* Change */}
                        <td className="p-4">
                          {Number(p.change_given) > 0 ? (
                            <span className="font-black text-amber-600 text-sm">PHP {fmt(p.change_given)}</span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">Exact</span>
                          )}
                        </td>

                        {/* Cashier */}
                        <td className="p-4">
                          <span className="text-xs font-bold" style={{ color: 'rgba(6,78,59,0.7)' }}>{p.received_by_user_id}</span>
                        </td>

                        {/* Date */}
                        <td className="p-4">
                          <p className="text-xs font-bold" style={{ color: '#064e3b' }}>{new Date(p.paid_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'rgba(6,78,59,0.5)' }}>{new Date(p.paid_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {selectedFine && (
        <PaymentModal
          fine={selectedFine}
          onClose={() => setSelectedFine(null)}
          onSuccess={() => {
            handlePaymentSuccess();
            setSelectedFine(null);
          }}
        />
      )}
    </div>
  );
}

// ── StatBadge helper ─────────────────────────────────────────────────────────
function StatBadge({ label, value, color, bg }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-sm" style={{ background: bg, border: `1px solid ${color}30` }}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
          {label}
        </p>
        <p className="text-2xl font-black leading-tight" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}
