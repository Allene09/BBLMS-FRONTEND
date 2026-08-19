import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  PiMagnifyingGlass as FiSearch,
  PiReceipt as FiReceipt,
  PiListBullets as FiList,
} from 'react-icons/pi';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PaymentHistory() {
  const { user } = useAuth();
  const [hSearch, setHSearch] = useState('');
  const [payments, setPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    const t = setTimeout(() => loadHistory(hSearch), 300);
    return () => clearTimeout(t);
  }, [hSearch, loadHistory]);

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 40%, #eff6ff 100%)' }} />
      <div className="absolute top-[-10%] right-[-5%] w-[35rem] h-[35rem] rounded-full z-0" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-15%] left-[10%] w-[40rem] h-[40rem] rounded-full z-0" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 drop-shadow-sm" style={{ color: '#064e3b' }}>
              <span className="p-2.5 rounded-2xl shadow-sm border border-white/50" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', color: '#059669' }}>
                <FiList size={28} />
              </span>
              Payment History
            </h1>
            <p className="text-sm lg:text-base font-semibold mt-2 ml-1" style={{ color: 'rgba(6,78,59,0.6)' }}>
              Past fine payments · {user?.username}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <StatBadge label="Total Collected" value={payments.length} color="#059669" bg="#ecfdf5" />
          </div>
        </div>

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

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase"
                        style={{ background: 'rgba(209,250,229,0.6)', border: '1px solid rgba(167,243,208,0.4)', color: '#065f46' }}>
                        <FiReceipt size={11} />
                        {p.receipt_no}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm" style={{ color: '#064e3b' }}>{p.borrower_name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(6,78,59,0.5)' }}>{p.borrower_id_no}</p>
                    </td>
                    <td className="p-4 max-w-[220px]">
                      <p className="font-bold text-sm line-clamp-2" style={{ color: '#064e3b' }}>{p.book_title}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-red-600 text-sm">PHP {fmt(p.fine_amount)}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-sm" style={{ color: '#064e3b' }}>PHP {fmt(p.amount_paid)}</span>
                    </td>
                    <td className="p-4">
                      {Number(p.change_given) > 0 ? (
                        <span className="font-black text-amber-600 text-sm">PHP {fmt(p.change_given)}</span>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">Exact</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold" style={{ color: 'rgba(6,78,59,0.7)' }}>{p.received_by_user_id}</span>
                    </td>
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

      </div>
    </div>
  );
}

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
