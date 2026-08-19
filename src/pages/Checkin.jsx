import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiCheck as FiCheck, PiMagnifyingGlass as FiSearch, PiArrowCounterClockwise as FiArrowLeft, PiUser as FiUser, PiBook as FiBook, PiClock as FiClock, PiMoney as FiMoney, PiWarningCircle as FiAlertCircle } from 'react-icons/pi';
import PaymentModal from '../components/PaymentModal';

export default function Checkin() {
  const [search, setSearch] = useState('');
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [payingLoan, setPayingLoan] = useState(null);

  const loadActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/active-loans');
      setAllLoans(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load active loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveLoans('');
  }, []);

  const handleReturnBook = async (loan) => {
    setReturningId(loan.id);
    try {
      const res = await api.post(`/transactions/checkin/${loan.id}`, {
        return_date: new Date().toISOString().split('T')[0],
      });

      const totalFine = Number(res.data?.totalFine || 0);
      if (totalFine > 0) {
        toast.success(`Book returned. Fine: PHP ${totalFine.toFixed(2)}`);
      } else {
        toast.success('Book returned successfully');
      }

      await loadActiveLoans();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to return book');
    } finally {
      setReturningId(null);
    }
  };

  const filteredLoans = allLoans.filter(loan => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      loan.borrower_name?.toLowerCase().includes(query) ||
      loan.borrower_id_no?.toLowerCase().includes(query) ||
      loan.book_title?.toLowerCase().includes(query) ||
      loan.book_author?.toLowerCase().includes(query) ||
      loan.book_barcode?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Soft blurred gradient background - Emerald/Teal themed for Returning */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ecfdf5] via-[#f0f9ff] to-[#f5f3ff] z-0" />
      
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-[120px] z-0" />
      <div className="absolute top-[30%] left-[-10%] w-[30rem] h-[30rem] bg-cyan-200/30 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-15%] right-[20%] w-[40rem] h-[40rem] bg-teal-200/30 rounded-full mix-blend-multiply filter blur-[150px] z-0" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-teal-950 tracking-tight flex items-center gap-3 drop-shadow-sm">
              <span className="p-2.5 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-teal-600">
                <FiArrowLeft size={28} />
              </span>
              Return Book
            </h1>
            <p className="text-sm lg:text-base text-teal-900/60 font-semibold mt-2 ml-1">
              Process incoming active loans with automatic fine calculation
            </p>
          </div>
        </div>

        {/* Universal Search Card */}
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl p-5 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-teal-900/60 mb-1.5 ml-1">Fast Search</label>
            <div className="relative max-w-3xl">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
              <input
                className="w-full bg-white/50 border border-white/60 focus:bg-white/90 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl pl-12 pr-4 py-3 text-base font-medium text-teal-950 placeholder:text-teal-900/40 outline-none transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                placeholder="Search by borrower name, ID No, book title, author, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Glassmorphism Table Container */}
        <div className="flex-1 bg-white/30 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] rounded-[2rem] overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          
          <div className="overflow-x-auto flex-1 custom-scrollbar relative z-10">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/50">
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-900/70 bg-white/20 backdrop-blur-md sticky top-0 z-20 w-[20%]"><div className="flex items-center gap-2"><FiUser size={14} className="text-teal-600"/> Borrower</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-900/70 bg-white/20 backdrop-blur-md sticky top-0 z-20 w-[30%]"><div className="flex items-center gap-2"><FiBook size={14} className="text-teal-600"/> Book Details</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-900/70 bg-white/20 backdrop-blur-md sticky top-0 z-20"><div className="flex items-center gap-2"><FiClock size={14} className="text-orange-500"/> Due Date</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-900/70 bg-white/20 backdrop-blur-md sticky top-0 z-20 text-center">Days Overdue</th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-900/70 bg-white/20 backdrop-blur-md sticky top-0 z-20 text-right"><div className="flex items-center justify-end gap-2"><FiMoney size={14} className="text-teal-600"/> Suggested Fine</div></th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-900/70 bg-white/20 backdrop-blur-md sticky top-0 z-20 text-center">Status</th>
                  <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-900/70 bg-white/20 backdrop-blur-md sticky top-0 z-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {loading ? (
                   <tr>
                    <td colSpan={7} className="text-center py-20">
                      <div className="inline-flex flex-col items-center gap-3">
                        <FiSearch size={32} className="animate-pulse text-teal-500" />
                        <span className="text-sm font-bold text-teal-900/50 uppercase tracking-widest">Scanning Active Loans...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-24">
                       <div className="inline-flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/50 flex items-center justify-center border border-white/60 shadow-lg shadow-teal-500/10">
                          <FiAlertCircle size={36} className="text-teal-400" />
                        </div>
                        <span className="text-base font-extrabold text-teal-950 tracking-tight">No Active Loans</span>
                        <span className="text-sm font-medium text-teal-900/60 max-w-sm leading-relaxed">No borrowed books matched your search or all books are returned.</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLoans.map((loan) => (
                  <tr key={loan.id} className="group hover:bg-white/40 transition-colors duration-200">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 font-black text-teal-800 flex items-center justify-center shadow-sm border border-white/60 flex-shrink-0 group-hover:scale-105 transition-transform">
                          {loan.borrower_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-teal-950 text-sm tracking-tight">{loan.borrower_name}</p>
                          <p className="text-[10px] font-bold text-teal-800/60 uppercase tracking-wider mt-0.5">{loan.borrower_id_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-teal-900 text-sm leading-snug line-clamp-2">{loan.book_title}</p>
                      <p className="text-[11px] font-semibold text-teal-800/60 mt-0.5 truncate max-w-[200px]">{loan.book_author || 'Unknown Author'}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/50 border border-white/60 text-[11px] font-bold text-teal-900/80 shadow-[0_1px_2px_rgb(0,0,0,0.02)]">
                        {new Date(loan.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                       {Number(loan.days_overdue || 0) > 0 ? (
                         <div className="inline-flex flex-col items-center justify-center p-2 rounded-xl bg-red-100/60 border border-red-200/60 min-w-[3rem]">
                           <span className="font-black text-red-600 text-base leading-none">{loan.days_overdue}</span>
                         </div>
                       ) : (
                         <span className="text-teal-900/40 font-bold text-xl">-</span>
                       )}
                    </td>
                    <td className="p-4 text-right">
                       <p className="font-black text-teal-950 text-base flex flex-col items-end leading-tight">
                        <span className="text-[9px] font-bold text-teal-900/40 uppercase tracking-widest mb-0.5">PHP</span>
                        {Number(loan.suggested_fine || 0).toFixed(2)}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                       <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-sm
                        ${loan.current_status === 'Overdue' ? 'bg-red-100/60 text-red-700 border-red-200/50' : 'bg-indigo-100/60 text-indigo-700 border-indigo-200/50'}`}>
                        {loan.current_status}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {loan.current_status === 'Overdue' ? (
                        <button
                          className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-2.5 w-full text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-red-400"
                          onClick={() => setPayingLoan(loan)}
                        >
                          <FiMoney size={16} className="group-hover/btn:scale-125 transition-transform" />
                          <span>Pay Fine</span>
                        </button>
                      ) : (
                        <button
                          className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-2.5 w-full text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-emerald-400"
                          disabled={returningId === loan.id}
                          onClick={() => handleReturnBook(loan)}
                        >
                          {returningId === loan.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <FiCheck size={16} className="group-hover/btn:scale-125 transition-transform" />
                          )}
                          <span>{returningId === loan.id ? 'Returning...' : 'Process Return'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {payingLoan && (
        <PaymentModal
          fine={{
            transaction_id: payingLoan.id,
            total_fine: payingLoan.suggested_fine,
            borrower_name: payingLoan.borrower_name,
            borrower_id_no: payingLoan.borrower_id_no,
            book_title: payingLoan.book_title,
            due_date: payingLoan.due_date,
          }}
          onClose={() => setPayingLoan(null)}
          onSuccess={() => {
            setPayingLoan(null);
            loadActiveLoans('');
          }}
        />
      )}
    </div>
  );
}
