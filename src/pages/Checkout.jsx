import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiMagnifyingGlass as FiSearch, PiCheck as FiCheck, PiPlus as FiPlus, PiX as FiX } from 'react-icons/pi';

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
  const [borrowers, setBorrowers] = useState([]);
  const [books, setBooks] = useState([]);
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

  const loadBorrowers = async (search) => {
    try {
      const res = await api.get('/borrowers', {
        params: {
          search: search || null,
          status: 'Active',
        },
      });
      setBorrowers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load borrowers');
    }
  };

  const loadBooks = async (search) => {
    try {
      const res = await api.get('/books', { params: { search: search || null } });
      const data = Array.isArray(res.data) ? res.data : [];
      setBooks(data.filter((book) => Number(book.copies_available || 0) > 0));
    } catch {
      toast.error('Failed to load books');
    }
  };

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
      await loadBooks(bookSearch);
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
      await loadBorrowers(created.id_no);
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

  const borrowerResultCount = borrowers.length;
  const bookResultCount = books.length;
  const totalVisibleCopies = books.reduce((sum, book) => sum + Number(book.copies_available || 0), 0);
  const canSaveBorrow = Boolean(selectedBorrower && selectedBook && loanDate && dueDate && dueDate >= loanDate);

  return (
    <div className="space-y-4">
      <div className="card p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100 font-semibold">Circulation</p>
              <h1 className="text-2xl font-extrabold tracking-tight mt-1">Borrow Book</h1>
              <p className="text-sm text-blue-100 mt-1 max-w-2xl">
                Select borrower, choose an available book, review loan details, then save the transaction.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 min-w-[260px]">
              <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Borrower Results</p>
                <p className="text-xl font-bold leading-tight">{borrowerResultCount}</p>
              </div>
              <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Book Results</p>
                <p className="text-xl font-bold leading-tight">{bookResultCount}</p>
              </div>
              <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Visible Copies</p>
                <p className="text-xl font-bold leading-tight">{totalVisibleCopies}</p>
              </div>
              <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-blue-100">Flow</p>
                <p className="text-sm font-semibold leading-tight">1 Select 2 Review 3 Save</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Step 1: Choose Borrower</h3>
              <p className="text-xs text-gray-500 mt-0.5">Search by ID number or full name</p>
            </div>
            <span className="badge badge-loaned">{borrowerResultCount} found</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              className="form-input"
              placeholder="Search borrower by ID or name"
              value={borrowerSearch}
              onChange={(e) => setBorrowerSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadBorrowers(borrowerSearch)}
            />
            <button className="btn btn-outline" onClick={() => loadBorrowers(borrowerSearch)}>
              <FiSearch size={16} />
            </button>
            <button
              className="btn btn-primary"
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

          <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto bg-white">
            <table className="data-table">
              <thead className="sticky top-0">
                <tr>
                  <th className="text-left p-2">ID No</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {borrowers.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-4">No borrowers found</td></tr>
                ) : borrowers.map((borrower) => (
                  <tr
                    key={borrower.id}
                    onClick={() => setSelectedBorrower(borrower)}
                    className={`cursor-pointer border-t ${selectedBorrower?.id === borrower.id ? 'selected' : ''}`}
                  >
                    <td className="p-2 font-mono">{borrower.id_no}</td>
                    <td className="p-2">{borrower.firstname} {borrower.lastname}</td>
                    <td className="p-2">{borrower.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Step 2: Choose Available Book</h3>
              <p className="text-xs text-gray-500 mt-0.5">Only books with available copies are shown</p>
            </div>
            <span className="badge badge-active">{bookResultCount} found</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              className="form-input"
              placeholder="Search book title, author, or barcode"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadBooks(bookSearch)}
            />
            <button className="btn btn-outline" onClick={() => loadBooks(bookSearch)}>
              <FiSearch size={16} />
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto bg-white">
            <table className="data-table">
              <thead className="sticky top-0">
                <tr>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Author</th>
                  <th className="text-center p-2">Available</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-4">No available books found</td></tr>
                ) : books.map((book) => (
                  <tr
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className={`cursor-pointer border-t ${selectedBook?.id === book.id ? 'selected' : ''}`}
                  >
                    <td className="p-2 font-medium">{book.title}</td>
                    <td className="p-2">{book.author || '-'}</td>
                    <td className="p-2 text-center">{book.copies_available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Step 3: Review Borrow Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">Set dates, optional notes, then save the loan transaction</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${selectedBorrower ? 'badge-loaned' : 'badge-inactive'}`}>
              {selectedBorrower ? 'Borrower selected' : 'Borrower required'}
            </span>
            <span className={`badge ${selectedBook ? 'badge-active' : 'badge-inactive'}`}>
              {selectedBook ? 'Book selected' : 'Book required'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 min-h-[78px]">
            <p className="text-xs text-blue-500 font-semibold mb-1">Selected Borrower</p>
            <p className="text-sm font-medium text-blue-900">
              {selectedBorrower ? `${selectedBorrower.firstname} ${selectedBorrower.lastname} (${selectedBorrower.id_no})` : 'None selected'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 min-h-[78px]">
            <p className="text-xs text-emerald-500 font-semibold mb-1">Selected Book</p>
            <p className="text-sm font-medium text-emerald-900">
              {selectedBook ? `${selectedBook.title} (${selectedBook.copies_available} available)` : 'None selected'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Borrow Date</label>
            <input type="date" className="form-input" value={loanDate} onChange={(e) => setLoanDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <label className="form-label">Notes</label>
            <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" />
          </div>
        </div>

        {dueDate && loanDate && dueDate < loanDate && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Due date should be the same as or later than borrow date.
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">Tip: Press Enter in search fields for quick lookup.</p>
          <button className="btn btn-primary" onClick={handleBorrow} disabled={saving || !canSaveBorrow}>
            <FiCheck size={16} /> {saving ? 'Saving...' : 'Save Borrow Transaction'}
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
