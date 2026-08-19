import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  PiCashRegister as FiCashRegister,
  PiX as FiX,
  PiUser as FiUser,
  PiBook as FiBook,
  PiClock as FiClock,
  PiCalendarBlank as FiCalendar,
  PiMoney as FiMoney,
  PiWarningCircle as FiAlertCircle,
  PiCheckCircle as FiCheckCircle,
  PiPrinter as FiPrinter,
} from 'react-icons/pi';

// ── Utilities ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

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

// ── Payment Modal ──────────────────────────────────────────────────────────────
export default function PaymentModal({ fine, onClose, onSuccess }) {
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
              {fine.return_date && <span className="flex items-center gap-1"><FiCalendar size={11} /> Returned: {fmtDate(fine.return_date)}</span>}
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
