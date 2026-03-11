import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';

const emptySupplier = {
  sup_code: '', company_name: '', address: '', phone: '', fax_no: '',
  mobile_phone: '', email: '', web_site: '', contact_person: '', position: '', gender: 'Male',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptySupplier });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers', { params: { search: search || undefined } });
      setSuppliers(res.data);
    } catch { toast.error('Failed to load suppliers'); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchSuppliers(); };
  const handleNew = () => { setForm({ ...emptySupplier }); setEditing(false); setShowModal(true); };

  const handleEdit = () => {
    if (!selected) return toast.error('Select a supplier first');
    setForm({ ...selected }); setEditing(true); setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selected) return toast.error('Select a supplier first');
    if (!window.confirm(`Delete "${selected.company_name}"?`)) return;
    try {
      await api.delete(`/suppliers/${selected.id}`);
      toast.success('Supplier deleted'); setSelected(null); fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sup_code || !form.company_name) return toast.error('Supplier code and company name are required');
    setLoading(true);
    try {
      if (editing) { await api.put(`/suppliers/${form.id}`, form); toast.success('Supplier updated'); }
      else { await api.post('/suppliers', form); toast.success('Supplier added'); }
      setShowModal(false); fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); } finally { setLoading(false); }
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Suppliers</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage supplier information and contacts</p>
      </div>

      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" onClick={handleNew}><FiPlus size={16} /> New</button>
          <button className="btn btn-warning" onClick={handleEdit}><FiEdit2 size={16} /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 size={16} /> Delete</button>
          <button className="btn btn-secondary" onClick={fetchSuppliers}><FiRefreshCw size={16} /> Refresh</button>
          <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" className="form-input pl-9 w-64" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <tr><th>Sup. Code</th><th>Name of Company</th><th>Contact Person</th></tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-500 py-8">No suppliers found</td></tr>
                ) : suppliers.map((s) => (
                  <tr key={s.id} className={selected?.id === s.id ? 'selected' : ''} onClick={() => setSelected(s)}>
                    <td className="font-mono">{s.sup_code}</td>
                    <td className="font-medium">{s.company_name}</td>
                    <td>{s.contact_person}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Supplier Details</h3>
          {selected ? (
            <div className="space-y-2 text-sm">
              {[
                ['SupCode', selected.sup_code], ['Company Name', selected.company_name],
                ['Address', selected.address], ['Phone', selected.phone],
                ['Fax No', selected.fax_no], ['Mobile Phone', selected.mobile_phone],
                ['Email', selected.email], ['Web Site', selected.web_site],
                ['Contact Person', selected.contact_person], ['Position', selected.position],
                ['Gender', selected.gender],
              ].map(([label, val]) => (
                <div key={label} className="flex">
                  <span className="w-32 text-gray-500 font-medium shrink-0">{label}:</span>
                  <span className="text-gray-800">{val || 'none'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Select a supplier to view details</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Supplier' : 'New Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Supplier Code *</label>
                  <input className="form-input" value={form.sup_code} onChange={(e) => handleChange('sup_code', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input className="form-input" value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Fax No</label>
                  <input className="form-input" value={form.fax_no} onChange={(e) => handleChange('fax_no', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Mobile Phone</label>
                  <input className="form-input" value={form.mobile_phone} onChange={(e) => handleChange('mobile_phone', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Web Site</label>
                  <input className="form-input" value={form.web_site} onChange={(e) => handleChange('web_site', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" value={form.contact_person} onChange={(e) => handleChange('contact_person', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Position</label>
                  <input className="form-input" value={form.position} onChange={(e) => handleChange('position', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
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
