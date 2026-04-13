import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiBookOpen as FiBookOpen, PiMagnifyingGlass as FiSearch, PiCalendar as FiCalendar, PiX as FiX, PiFunnel as FiFunnel, PiUser as FiUser, PiBook as FiBook, PiClock as FiClock, PiMoney as FiMoney, PiChecks as FiChecks, PiWarningCircle as FiAlertCircle } from 'react-icons/pi';

function inDateRange(value, fromDate, toDate) {
  if (!value) return false;
  const dateOnly = String(value).split('T')[0];
  if (fromDate && dateOnly < fromDate) return false;
  if (toDate && dateOnly > toDate) return false;
  return true;
}

export default function BorrowRecords() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', {
        params: {
          status: status || null,
          search: search || null,
        },
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load borrow records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filtered = useMemo(() => {
    if (!fromDate && !toDate) return rows;
    return rows.filter((row) => inDateRange(row.loan_date, fromDate, toDate));
  }, [rows, fromDate, toDate]);

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Soft blurred gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f3ff] via-[#e0e7ff] to-[#f0fdf4] z-0" />
      
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[120px] z-0" />
      <div className="absolute top-[30%] left-[-10%] w-[30rem] h-[30rem] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-15%] right-[20%] w-[40rem] h-[40rem] bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-[150px] z-0" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-indigo-950 tracking-tight flex items-center gap-3 drop-shadow-sm">
              <span className="p-2.5 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-indigo-600">
                <FiBookOpen size={28} />
              </span>
              Borrow Records
            </h1>
            <p className="text-sm lg:text-base text-indigo-900/60 font-semibold mt-2 ml-1">
              Historical archive of all library transactions and circulation activity
            </p>
          </div>
        </div>

        {/* Glassmorphic Filters */}
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl p-5 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/60 mb-1.5 ml-1">Status</label>
              <select 
                className="w-full bg-white/50 border border-white/60 focus:bg-white/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-950 outline-none transition-all shadow-sm appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 7l5 5 5-5'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                value={status} 
                onChange={(e) => {
                  setStatus(e.target.value);
                  setTimeout(loadRecords, 0); // trigger reload immediately since status filtering happens server-side
                }}
              >
                <option value="">All Transactions</option>
                <option value="Loaned">Active Loans</option>
                <option value="Overdue">Overdue Books</option>
                <option value="Returned">Completed / Returned</option>
              </select>
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/60 mb-1.5 ml-1">Universal Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                <input
                  className="w-full bg-white/50 border border-white/60 focus:bg-white/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-indigo-950 placeholder:text-indigo-900/40 outline-none transition-all shadow-sm"
                  placeholder="Search by name, ID number, title, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadRecords()}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/60 mb-1.5 ml-1">From Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                <input 
                  type="date" 
                  className="w-full bg-white/50 border border-white/60 focus:bg-white/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-indigo-950 outline-none transition-all shadow-sm"
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)} 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/60 mb-1.5 ml-1">To Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                <input 
                  type="date" 
                  className="w-full bg-white/50 border border-white/60 focus:bg-white/80 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-indigo-950 outline-none transition-all shadow-sm"
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)} 
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3 relative z-10 border-t border-white/30 pt-4">
             <button
                className="px-5 py-2.5 bg-white/40 border border-white/60 text-indigo-700 hover:bg-white/60 hover:text-indigo-800 rounded-xl transition-all text-sm font-bold shadow-sm flex items-center justify-center gap-2"
                onClick={() => {
                  setStatus('');
                  setSearch('');
                  setFromDate('');
                  setToDate('');
                  setTimeout(loadRecords, 0);
                }}
              >
                <FiX size={16} /> Clear Filters
              </button>
              <button 
                className="px-6 py-2.5 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 rounded-xl transition-all text-sm font-bold flex items-center justify-center gap-2"
                onClick={loadRecords}
              >
                <FiFunnel size={16} /> Apply Filters
              </button>
          </div>
        </div>

        {/* Glassmorphism Table Container */}
        <div className="flex-1 bg-white/20 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] rounded-[2rem] overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
          
          <div className="overflow-x-auto flex-1 custom-scrollbar relative z-10">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/50">
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 w-[20%]"><div className="flex items-center gap-2"><FiUser size={14} className="text-indigo-500"/> Borrower</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 w-[25%]"><div className="flex items-center gap-2"><FiBook size={14} className="text-indigo-500"/> Book</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20"><div className="flex items-center gap-2"><FiClock size={14} className="text-indigo-500"/> Loaned</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20"><div className="flex items-center gap-2"><FiClock size={14} className="text-orange-500"/> Due</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20"><div className="flex items-center gap-2"><FiChecks size={14} className="text-emerald-500"/> Returned</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 text-center">Status</th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/70 bg-white/10 backdrop-blur-sm sticky top-0 z-20 text-right"><div className="flex items-center justify-end gap-2"><FiMoney size={14} className="text-indigo-500"/> Total Fine</div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {loading ? (
                   <tr>
                    <td colSpan={7} className="text-center py-20">
                      <div className="inline-flex flex-col items-center gap-3">
                        <FiSearch size={32} className="animate-pulse text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-900/50 uppercase tracking-widest">Searching Archives...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-24">
                       <div className="inline-flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center border border-white/60 shadow-lg shadow-indigo-500/10">
                          <FiAlertCircle size={36} className="text-indigo-400" />
                        </div>
                        <span className="text-base font-extrabold text-indigo-950 tracking-tight">No Records Found</span>
                        <span className="text-sm font-medium text-indigo-900/60 max-w-sm leading-relaxed">Adjust your filters or try a different universal search query.</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((row) => (
                  <tr key={row.id} className="group hover:bg-white/30 transition-colors duration-200">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-100 to-purple-100 font-black text-indigo-800 flex items-center justify-center shadow-sm border border-white/60 flex-shrink-0">
                          {row.borrower_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-indigo-950 text-sm tracking-tight">{row.borrower_name}</p>
                          <p className="text-[10px] font-bold text-indigo-800/50 uppercase tracking-wider">{row.borrower_id_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-indigo-900 text-sm leading-snug line-clamp-2">{row.book_title}</p>
                      <p className="text-[10px] font-bold text-indigo-800/50 uppercase tracking-wider mt-0.5">{row.book_barcode}</p>
                    </td>
                    <td className="p-4">
                       <span className="text-xs font-semibold text-indigo-900/80">
                        {row.loan_date ? new Date(row.loan_date).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="p-4">
                       <span className="text-xs font-bold text-orange-600/90 drop-shadow-sm">
                        {row.due_date ? new Date(row.due_date).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-emerald-600/90 drop-shadow-sm">
                        {row.return_date ? new Date(row.return_date).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-sm
                        ${row.status === 'Returned' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50' : 
                          row.status === 'Overdue' ? 'bg-red-100/50 text-red-700 border-red-200/50' : 
                          'bg-indigo-100/50 text-indigo-700 border-indigo-200/50'}`}>
                        {row.status}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                       <p className="font-black text-indigo-950 text-sm flex flex-col items-end leading-tight">
                        <span className="text-[9px] font-bold text-indigo-900/40 uppercase tracking-widest mb-0.5">PHP</span>
                        {Number(row.total_fine || 0).toFixed(2)}
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
