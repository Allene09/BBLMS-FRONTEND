import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiArrowsClockwise as FiRefreshCw, PiWarningCircle as FiAlertCircle, PiClock as FiClock, PiUser as FiUser, PiBook as FiBook, PiMoney as FiMoney } from 'react-icons/pi';

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
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Soft blurred gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#dbeafe] z-0" />
      
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[120px] z-0" />
      <div className="absolute bottom-[-15%] left-[20%] w-[40rem] h-[40rem] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[150px] z-0" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-indigo-950 tracking-tight flex items-center gap-3 drop-shadow-sm">
              <span className="p-2.5 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-indigo-600">
                <FiClock size={28} />
              </span>
              Overdue Monitoring
            </h1>
            <p className="text-sm lg:text-base text-indigo-900/60 font-semibold mt-2 ml-1">
              Real-time radar for outstanding books and accruing fines
            </p>
          </div>
          <button 
            onClick={loadOverdue}
            disabled={loading}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-indigo-700 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-full border border-white/60 shadow-[0_8px_30px_rgb(99,102,241,0.2)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.3)] transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500 ease-in-out'}`} />
            <span>{loading ? 'Refreshing Radar...' : 'Refresh Radar'}</span>
          </button>
        </div>

        {/* Dashboard Metrics (Optional extra flair) */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-xs font-bold text-indigo-800/60 uppercase tracking-widest mb-1">Total Overdue</p>
              <p className="text-3xl font-black text-indigo-950">{rows.length}</p>
            </div>
            <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-xs font-bold text-indigo-800/60 uppercase tracking-widest mb-1">Highest Fine</p>
              <p className="text-2xl font-black text-indigo-950 flex items-center gap-1 mt-1">
                <span className="text-base text-indigo-900/50">PHP</span> 
                {Math.max(...rows.map(r => Number(r.estimated_fine || 0))).toFixed(2)}
              </p>
            </div>
            <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-xs font-bold text-indigo-800/60 uppercase tracking-widest mb-1">Most Overdue</p>
              <p className="text-2xl font-black text-indigo-950 flex items-center gap-1 mt-1">
                {Math.max(...rows.map(r => Number(r.days_overdue || 0)))} <span className="text-base text-indigo-900/50">Days</span>
              </p>
            </div>
          </div>
        )}

        {/* Glassmorphism Table Container */}
        <div className="flex-1 bg-white/20 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] rounded-[2rem] overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
          
          <div className="overflow-x-auto flex-1 custom-scrollbar relative z-10">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/50">
                  <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 w-[25%]"><div className="flex items-center gap-2"><FiUser size={14} className="text-indigo-500"/> Borrower</div></th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 w-[35%]"><div className="flex items-center gap-2"><FiBook size={14} className="text-indigo-500"/> Book Title</div></th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 w-[15%]"><div className="flex items-center gap-2"><FiClock size={14} className="text-indigo-500"/> Due Date</div></th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 w-[10%] text-center">Days</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 w-[15%] text-right"><div className="flex items-center justify-end gap-2"><FiMoney size={14} className="text-indigo-500"/> Fine Setup</div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-24">
                      <div className="inline-flex flex-col items-center gap-3">
                        <FiRefreshCw size={32} className="animate-spin text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-900/50 uppercase tracking-widest">Scanning Databases...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-32">
                      <div className="inline-flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center border border-white/60 shadow-lg shadow-indigo-500/10">
                          <FiAlertCircle size={36} className="text-indigo-400" />
                        </div>
                        <span className="text-base font-extrabold text-indigo-950 tracking-tight">Zone Clear</span>
                        <span className="text-sm font-medium text-indigo-900/60 max-w-sm leading-relaxed">There are currently no overdue books in the library system. Everything is perfectly balanced.</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="group hover:bg-white/30 transition-colors duration-200">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 font-black text-indigo-800 flex items-center justify-center shadow-sm border border-white/60 group-hover:scale-105 transition-transform flex-shrink-0">
                          {row.borrower_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-indigo-950 text-sm tracking-tight">{row.borrower_name}</p>
                          <p className="text-[11px] font-semibold text-indigo-800/60 mt-0.5 tracking-wider">{row.borrower_id_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-semibold text-indigo-900 text-sm leading-snug line-clamp-2">{row.book_title}</p>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/40 border border-white/50 text-[11px] font-bold text-indigo-900/80 shadow-sm">
                        {new Date(row.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="inline-flex flex-col items-center justify-center p-2 rounded-xl bg-red-100/50 border border-red-200/50 min-w-[3rem]">
                        <span className="font-black text-red-600 text-base leading-none">{row.days_overdue}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <p className="font-black text-indigo-950 text-base flex flex-col items-end leading-tight">
                        <span className="text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-0.5">PHP</span>
                        {Number(row.estimated_fine || 0).toFixed(2)}
                      </p>
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
