import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiPlus as FiPlus, PiPencilSimple as FiEdit2, PiTrash as FiTrash2, PiArrowsClockwise as FiRefreshCw, PiMagnifyingGlass as FiSearch, PiX as FiX } from 'react-icons/pi';

const emptyBorrower = {
  id_no: '', firstname: '', lastname: '', mobile_phone: '', phone: '',
  email: '', address: '', notes: '', type: 'Student', status: 'Active',
};

export default function Borrowers() {
  const [borrowers, setBorrowers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyBorrower });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBorrowers = async () => {
    try {
      const res = await api.get('/borrowers', { params: { search: search || undefined } });
      setBorrowers(res.data);
    } catch { toast.error('Failed to load borrowers'); }
  };

  useEffect(() => { fetchBorrowers(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchBorrowers(); };

  const handleNew = () => { setForm({ ...emptyBorrower }); setEditing(false); setShowModal(true); };

  const handleEdit = () => {
    if (!selected) return toast.error('Select a borrower first');
    setForm({ ...selected }); setEditing(true); setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selected) return toast.error('Select a borrower first');
    if (!window.confirm(`Delete "${selected.firstname} ${selected.lastname}"?`)) return;
    try {
      await api.delete(`/borrowers/${selected.id}`);
      toast.success('Borrower deleted'); setSelected(null); fetchBorrowers();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_no || !form.firstname || !form.lastname) return toast.error('ID No, First Name, and Last Name are required');
    setLoading(true);
    try {
      if (editing) { await api.put(`/borrowers/${form.id}`, form); toast.success('Borrower updated'); }
      else { await api.post('/borrowers', form); toast.success('Borrower added'); }
      setShowModal(false); fetchBorrowers();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); } finally { setLoading(false); }
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const getBadge = (type) => {
    const map = { Student: 'badge-student', Faculty: 'badge-faculty', Others: 'badge-others' };
    return map[type] || '';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Borrowers</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage borrower master records</p>
      </div>

      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" onClick={handleNew}><FiPlus size={16} /> New</button>
          <button className="btn btn-warning" onClick={handleEdit}><FiEdit2 size={16} /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 size={16} /> Delete</button>
          <button className="btn btn-secondary" onClick={fetchBorrowers}><FiRefreshCw size={16} /> Refresh</button>
          <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" className="form-input pl-9 w-64" placeholder="Search borrowers..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 overflow-hidden p-0">
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="data-table">
              <thead className="sticky top-0">
                <tr><th>ID No.</th><th>Borrower's Name</th><th>Type</th><th>Status</th></tr>
              </thead>
              <tbody>
                {borrowers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-500 py-8">No borrowers found</td></tr>
                ) : borrowers.map((b) => (
                  <tr key={b.id} className={selected?.id === b.id ? 'selected' : ''} onClick={() => setSelected(b)}>
                    <td className="font-mono">{b.id_no}</td>
                    <td className="font-medium">{b.lastname}, {b.firstname}</td>
                    <td><span className={`badge ${getBadge(b.type)}`}>{b.type}</span></td>
                    <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Borrower Details</h3>
          {selected ? (
            <div className="space-y-2 text-sm">
              {[
                ['ID No', selected.id_no], ['Firstname', selected.firstname], ['Lastname', selected.lastname],
                ['Mobile Phone', selected.mobile_phone], ['Phone', selected.phone], ['Email', selected.email],
                ['Address', selected.address], ['Notes', selected.notes],
                ['Date Registered', selected.date_registered], ['Type', selected.type], ['Status', selected.status],
              ].map(([label, val]) => (
                <div key={label} className="flex">
                  <span className="w-32 text-gray-500 font-medium shrink-0">{label}:</span>
                  <span className="text-gray-800">{val || 'none'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Select a borrower to view details</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Borrower' : 'New Borrower'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">ID No. *</label>
                  <input className="form-input" value={form.id_no} onChange={(e) => handleChange('id_no', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
                    <option>Student</option><option>Faculty</option><option>Others</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">First Name *</label>
                  <input className="form-input" value={form.firstname} onChange={(e) => handleChange('firstname', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" value={form.lastname} onChange={(e) => handleChange('lastname', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Mobile Phone</label>
                  <input className="form-input" value={form.mobile_phone} onChange={(e) => handleChange('mobile_phone', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (editing ? 'Update' : 'Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
