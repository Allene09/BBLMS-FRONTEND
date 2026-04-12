import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiMagnifyingGlass as FiSearch, PiCheck as FiCheck, PiPlus as FiPlus, PiX as FiX, PiUser as FiUser, PiBook as FiBook, PiCalendar as FiCalendar, PiFloppyDisk as FiSave } from 'react-icons/pi';

const emptyBorrowerForm = {
  id_no: '',
  firstname: '',
  lastname: '',
  contact_number: '',
  department: '',
  type: 'Student',
  status: 'Active',
};

export default function Checkout() {
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [allBorrowers, setAllBorrowers] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [borrowerForm, setBorrowerForm] = useState({ ...emptyBorrowerForm });
  const [registerErrors, setRegisterErrors] = useState({});
  const [registerFormError, setRegisterFormError] = useState('');

  useEffect(() => {
    const due = new Date();
    due.setDate(due.getDate() + 3);
    setDueDate(due.toISOString().split('T')[0]);
    loadBorrowers('');
    loadBooks('');
  }, []);

  const loadBorrowers = async () => {
    try {
      const res = await api.get('/borrowers', { params: { status: 'Active' } });
      setAllBorrowers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load borrowers');
    }
  };

  const loadBooks = async () => {
    try {
      const res = await api.get('/books');
      const data = Array.isArray(res.data) ? res.data : [];
      setAllBooks(data.filter((book) => Number(book.copies_available || 0) > 0));
    } catch {
      toast.error('Failed to load books');
    }
  };

  const filteredBorrowers = borrowerSearch.trim()
    ? allBorrowers.filter(b => {
        const query = borrowerSearch.toLowerCase();
        return (
          b.id_no?.toLowerCase().includes(query) ||
          b.firstname?.toLowerCase().includes(query) ||
          b.lastname?.toLowerCase().includes(query) ||
          `${b.firstname} ${b.lastname}`.toLowerCase().includes(query)
        );
      })
    : allBorrowers;

  const filteredBooks = bookSearch.trim()
    ? allBooks.filter(b => {
        const query = bookSearch.toLowerCase();
        return (
          b.title?.toLowerCase().includes(query) ||
          b.author?.toLowerCase().includes(query) ||
          b.barcode?.toLowerCase().includes(query) ||
          b.isbn?.toLowerCase().includes(query)
        );
      })
    : allBooks;

  const handleBorrow = async () => {
    if (!selectedBorrower) return toast.error('Select a borrower first');
    if (!selectedBook) return toast.error('Select an available book first');
    if (!loanDate || !dueDate) return toast.error('Set both borrow date and due date');
    if (dueDate < loanDate) return toast.error('Due date cannot be earlier than borrow date');

    setSaving(true);
    try {
      await api.post('/transactions/checkout', {
        borrower_id: selectedBorrower.id,
        book_id: selectedBook.id,
        loan_date: loanDate,
        due_date: dueDate,
        notes,
      });

      toast.success('Borrow transaction saved successfully');
      setSelectedBook(null);
      setNotes('');
      await loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save borrow transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterBorrower = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!borrowerForm.id_no.trim()) errors.id_no = 'ID No is required';
    if (!borrowerForm.firstname.trim()) errors.firstname = 'First name is required';
    if (!borrowerForm.lastname.trim()) errors.lastname = 'Last name is required';

    const contactDigits = borrowerForm.contact_number.replace(/\D/g, '');
    if (contactDigits.length !== 11) {
      errors.contact_number = 'Contact number must be exactly 11 digits';
    }

    setRegisterErrors(errors);
    setRegisterFormError('');

    if (Object.keys(errors).length > 0) {
      return toast.error('Please fix the highlighted fields');
    }

    setRegistering(true);
    try {
      const payload = {
        id_no: borrowerForm.id_no.trim(),
        firstname: borrowerForm.firstname.trim(),
        lastname: borrowerForm.lastname.trim(),
        mobile_phone: borrowerForm.contact_number.replace(/\D/g, ''),
        notes: borrowerForm.department.trim() ? `Department: ${borrowerForm.department.trim()}` : null,
        type: borrowerForm.type,
        status: 'Active',
      };

      const res = await api.post('/borrowers', payload);
      const created = res.data;

      toast.success('Borrower registered successfully');
      setSelectedBorrower(created);
      setBorrowerSearch(created.id_no);
      setShowRegisterModal(false);
      setBorrowerForm({ ...emptyBorrowerForm });
      setRegisterErrors({});
      setRegisterFormError('');
      await loadBorrowers();
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to register borrower';
      setRegisterFormError(message);

      if (/already exists|already exist/i.test(message)) {
        setRegisterErrors((prev) => ({ ...prev, id_no: 'This ID No is already registered' }));
      }

      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  const borrowerResultCount = filteredBorrowers.length;
  const bookResultCount = filteredBooks.length;
  const totalVisibleCopies = filteredBooks.reduce((sum, book) => sum + Number(book.copies_available || 0), 0);
  const canSaveBorrow = Boolean(selectedBorrower && selectedBook && loanDate && dueDate && dueDate >= loanDate);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl shadow-xl shadow-blue-900/5 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="px-8 py-8 relative">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-blue-200 font-bold mb-1.5 flex items-center gap-2">
                <FiBook size={14} /> Circulation
              </p>
              <h1 className="text-3xl font-black text-white tracking-tight">Borrow Book</h1>
              <p className="text-sm text-blue-100/90 mt-2 max-w-xl leading-relaxed">
                Complete a new loan by finding a borrower, selecting an available copy, and confirming the appropriate dates.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Borrower Results', value: borrowerResultCount },
                { label: 'Book Results', value: bookResultCount },
                { label: 'Visible Copies', value: totalVisibleCopies },
                { label: 'System Flow', value: '3 Steps', sm: true }
              ].map((stat, i) => (
                <div key={i} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 shadow-lg shadow-black/5 hover:bg-white/15 transition-colors">
                  <p className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold mb-1">{stat.label}</p>
                  <p className={`font-bold text-white ${stat.sm ? 'text-sm mt-1' : 'text-xl'}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm shadow-sm">1</div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Choose Borrower</h3>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">Search by ID or name</p>
              </div>
            </div>
            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">{borrowerResultCount} found</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 font-medium"
                placeholder="ID number or name..."
                value={borrowerSearch}
                onChange={(e) => setBorrowerSearch(e.target.value)}
              />
            </div>
            <button
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm font-bold"
              onClick={() => {
                setShowRegisterModal(true);
                setBorrowerForm({ ...emptyBorrowerForm, id_no: borrowerSearch.trim() });
                setRegisterErrors({});
                setRegisterFormError('');
              }}
              type="button"
            >
              <FiPlus size={16} /> Register
            </button>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden flex-1 flex flex-col bg-gray-50/30">
            <div className="max-h-72 overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-100/90 backdrop-blur-md shadow-sm z-10 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">ID No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3 pr-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBorrowers.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-gray-400 py-8 font-medium text-sm">No borrowers found</td></tr>
                  ) : filteredBorrowers.map((borrower) => {
                    const isSelected = selectedBorrower?.id === borrower.id;
                    return (
                      <tr
                        key={borrower.id}
                        onClick={() => setSelectedBorrower(borrower)}
                        className={`cursor-pointer transition-colors group ${isSelected ? 'bg-blue-50/80 hover:bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <td className="p-3 pl-4 relative">
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md" />}
                          <span className={`font-mono text-sm ${isSelected ? 'text-blue-700 font-bold' : 'text-gray-600 font-medium group-hover:text-blue-600'}`}>{borrower.id_no}</span>
                        </td>
                        <td className={`p-3 text-sm ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-800 font-medium'}`}>
                          {borrower.firstname} {borrower.lastname}
                        </td>
                        <td className="p-3 pr-4">
                          <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {borrower.type}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm shadow-sm">2</div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Choose Available Book</h3>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">Title, author, or barcode</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">{bookResultCount} found</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-400 font-medium"
                placeholder="Search by title, author, or barcode..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden flex-1 flex flex-col bg-gray-50/30">
            <div className="max-h-72 overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-100/90 backdrop-blur-md shadow-sm z-10 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th className="p-3 pl-4 w-[50%]">Title</th>
                    <th className="p-3">Author</th>
                    <th className="p-3 pr-4 text-center">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBooks.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-gray-400 py-8 font-medium text-sm">No available books found</td></tr>
                  ) : filteredBooks.map((book) => {
                    const isSelected = selectedBook?.id === book.id;
                    return (
                      <tr
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className={`cursor-pointer transition-colors group ${isSelected ? 'bg-emerald-50/80 hover:bg-emerald-50' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <td className="p-3 pl-4 relative">
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md" />}
                          <p className={`text-sm tracking-tight ${isSelected ? 'text-emerald-900 font-bold' : 'text-gray-800 font-semibold group-hover:text-emerald-700'}`}>
                            {book.title}
                          </p>
                        </td>
                        <td className={`p-3 text-sm ${isSelected ? 'text-emerald-800 font-medium' : 'text-gray-500'}`}>
                          {book.author || <span className="text-gray-400 italic">Unknown</span>}
                        </td>
                        <td className="p-3 pr-4 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                            {book.copies_available}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm shadow-inner shadow-black/10">3</div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Review & Save Details</h3>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">Finalize transaction</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-colors ${selectedBorrower ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
              {selectedBorrower ? '✓ Borrower Selected' : '! Borrower Required'}
            </span>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-colors ${selectedBook ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
              {selectedBook ? '✓ Book Selected' : '! Book Required'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200 shadow-sm overflow-hidden flex gap-4 items-center">
            <div className="absolute -right-4 -bottom-4 text-blue-500/10">
              <FiUser size={100} />
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center flex-shrink-0 relative z-10 text-blue-600">
              <FiUser size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-widest font-bold text-blue-500 mb-0.5">Selected Borrower</p>
              {selectedBorrower ? (
                <>
                  <p className="text-base font-black text-blue-950">{selectedBorrower.firstname} {selectedBorrower.lastname}</p>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">{selectedBorrower.id_no} • {selectedBorrower.type}</p>
                </>
              ) : (
                <p className="text-sm font-medium text-blue-800/60 mt-1">None selected</p>
              )}
            </div>
          </div>

          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-200 shadow-sm overflow-hidden flex gap-4 items-center">
            <div className="absolute -right-4 -bottom-4 text-emerald-500/10">
              <FiBook size={100} />
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center flex-shrink-0 relative z-10 text-emerald-600">
              <FiBook size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-500 mb-0.5">Selected Book</p>
              {selectedBook ? (
                <>
                  <p className="text-base font-black text-emerald-950 line-clamp-1">{selectedBook.title}</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">{selectedBook.copies_available} available for checkout</p>
                </>
              ) : (
                <p className="text-sm font-medium text-emerald-800/60 mt-1">None selected</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FiCalendar className="text-gray-400" /> Borrow Date
              </label>
              <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={loanDate} onChange={(e) => setLoanDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FiCalendar className="text-gray-400" /> Due Date
              </label>
              <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Optional Notes</label>
              <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="E.g. requested by faculty" />
            </div>
          </div>
          
          {dueDate && loanDate && dueDate < loanDate && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold text-sm shadow-sm">
              <FiX className="text-red-500" size={18} /> Due date cannot be earlier than borrow date.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            className={`px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl ${canSaveBorrow && !saving ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 shadow-transparent cursor-not-allowed border border-gray-200'}`} 
            onClick={handleBorrow} 
            disabled={saving || !canSaveBorrow}
          >
            {saving ? (
              <span className="flex items-center gap-2">Saving Transaction...</span>
            ) : (
              <>
                <FiSave size={20} /> Finalize Borrow Transaction
              </>
            )}
          </button>
        </div>
      </div>

      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-800">Register New Borrower</h2>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Complete required fields to add a borrower and auto-select them for checkout.</p>

            <form onSubmit={handleRegisterBorrower} className="space-y-4">
              {registerFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {registerFormError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">ID No *</label>
                  <input
                    className={`form-input ${registerErrors.id_no ? 'border-red-400 focus:border-red-500' : ''}`}
                    value={borrowerForm.id_no}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBorrowerForm((prev) => ({ ...prev, id_no: value }));
                      setRegisterErrors((prev) => ({ ...prev, id_no: undefined }));
                      setRegisterFormError('');
                    }}
                    required
                  />
                  {registerErrors.id_no && <p className="text-xs text-red-500 mt-1">{registerErrors.id_no}</p>}
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={borrowerForm.type}
                    onChange={(e) => setBorrowerForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">First Name *</label>
                  <input
                    className={`form-input ${registerErrors.firstname ? 'border-red-400 focus:border-red-500' : ''}`}
                    value={borrowerForm.firstname}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBorrowerForm((prev) => ({ ...prev, firstname: value }));
                      setRegisterErrors((prev) => ({ ...prev, firstname: undefined }));
                      setRegisterFormError('');
                    }}
                    required
                  />
                  {registerErrors.firstname && <p className="text-xs text-red-500 mt-1">{registerErrors.firstname}</p>}
                </div>
                <div>
                  <label className="form-label">Last Name *</label>
                  <input
                    className={`form-input ${registerErrors.lastname ? 'border-red-400 focus:border-red-500' : ''}`}
                    value={borrowerForm.lastname}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBorrowerForm((prev) => ({ ...prev, lastname: value }));
                      setRegisterErrors((prev) => ({ ...prev, lastname: undefined }));
                      setRegisterFormError('');
                    }}
                    required
                  />
                  {registerErrors.lastname && <p className="text-xs text-red-500 mt-1">{registerErrors.lastname}</p>}
                </div>
                <div>
                  <label className="form-label">Contact Number *</label>
                  <input
                    className={`form-input ${registerErrors.contact_number ? 'border-red-400 focus:border-red-500' : ''}`}
                    value={borrowerForm.contact_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setBorrowerForm((prev) => ({ ...prev, contact_number: value }));
                      setRegisterErrors((prev) => ({ ...prev, contact_number: undefined }));
                      setRegisterFormError('');
                    }}
                    placeholder="09XXXXXXXXX"
                    inputMode="numeric"
                    maxLength={11}
                    required
                  />
                  {registerErrors.contact_number && <p className="text-xs text-red-500 mt-1">{registerErrors.contact_number}</p>}
                </div>
                <div>
                  <label className="form-label">College</label>
                  <input
                    className="form-input"
                    value={borrowerForm.department}
                    onChange={(e) => setBorrowerForm((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. College of Education"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={registering}>
                  <FiCheck size={16} /> {registering ? 'Registering...' : 'Register Borrower'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
