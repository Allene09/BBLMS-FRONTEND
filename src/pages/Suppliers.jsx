import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PiPlus as FiPlus, PiPencilSimple as FiEdit2, PiTrash as FiTrash2, PiArrowsClockwise as FiRefreshCw, PiMagnifyingGlass as FiSearch, PiX as FiX } from 'react-icons/pi';

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
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      {/* Ambient background for Suppliers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f5f3ff] z-0" />
      
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-blue-300/50 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />
      <div className="absolute bottom-[-15%] left-[20%] w-[45rem] h-[45rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] z-0" />

      <div className="relative z-10 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm flex items-center gap-3">
              Supplier Directory
            </h1>
            <p className="text-sm lg:text-base text-slate-600/80 font-semibold mt-1">Manage vendor information, procurement contacts, and communications</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 flex flex-wrap items-center gap-3 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />

          <div className="flex gap-2 relative z-10 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-[0_4px_15px_rgb(79,70,229,0.3)] hover:bg-indigo-700 hover:-translate-y-0.5 transition-all w-max" onClick={handleNew}>
              <FiPlus size={16} /> New Supplier
            </button>
            <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all w-max ${selected ? 'bg-white/60 border-amber-300 text-amber-700 hover:bg-amber-50 shadow-sm' : 'bg-white/30 border-white/40 text-slate-400 cursor-not-allowed'}`} onClick={handleEdit} disabled={!selected}>
              <FiEdit2 size={16} /> Edit
            </button>
            <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all w-max ${selected ? 'bg-white/60 border-red-300 text-red-600 hover:bg-red-50 shadow-sm' : 'bg-white/30 border-white/40 text-slate-400 cursor-not-allowed'}`} onClick={handleDelete} disabled={!selected}>
              <FiTrash2 size={16} /> Delete
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/50 border border-white/60 text-slate-700 hover:bg-white/80 transition-all shadow-sm w-max" onClick={fetchSuppliers}>
              <FiRefreshCw size={16} /> Refresh
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex relative z-10 w-full lg:w-auto lg:ml-auto lg:max-w-md">
            <div className="relative w-full flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="text-indigo-400" size={18} />
              </div>
              <input 
                type="text" 
                className="w-full bg-white/50 focus:bg-white/80 text-custom-text-dark text-sm font-bold rounded-l-2xl border border-white/60 pl-11 pr-4 py-3 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                placeholder="Search firm, contact, or code..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
              <button type="submit" className="px-6 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold tracking-wide rounded-r-2xl transition-colors border border-indigo-500 shadow-md">
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Content: Table + Details */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[400px]">
          {/* Table Container - Dictates Organic Height */}
          <div className="bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col lg:w-2/3 xl:w-3/4 relative max-h-[70vh] min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative z-10 min-h-0">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-white/20 backdrop-blur-md sticky top-0 z-20">
                  <tr className="border-b border-white/40">
                    <th className="p-5 pl-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80 w-1/4">Firm Identifier</th>
                    <th className="p-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80 w-2/4">Corporate Name</th>
                    <th className="p-5 pr-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500/80 w-1/4">Primary Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30">
                  {suppliers.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-slate-500 py-12 font-bold bg-white/10">No suppliers matched the criteria.</td></tr>
                  ) : suppliers.map((s) => {
                    const isSelected = selected?.id === s.id;
                    return (
                      <tr 
                        key={s.id} 
                        className={`cursor-pointer transition-all duration-200 group ${isSelected ? 'bg-indigo-50/60 shadow-inner' : 'hover:bg-white/40'}`}
                        onClick={() => setSelected(s)}
                      >
                        <td className="p-4 pl-8 relative">
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />}
                          <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-mono font-black border ${isSelected ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white/50 text-slate-600 border-white/60 group-hover:bg-white/80'}`}>
                            {s.sup_code}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{s.company_name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[300px] mt-0.5">{s.address || 'Address unlisted'}</p>
                        </td>
                        <td className="p-4 pr-8">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>{s.contact_person || '—'}</p>
                          <p className="text-[10px] uppercase font-black text-slate-400 mt-0.5 tracking-wider">{s.position || 'Representative'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Sidebar container mapped to absolute height of flex sibling */}
          <div className="lg:w-1/3 xl:w-1/4 relative lg:min-h-0 min-h-[400px]">
             {/* Uses absolute positioning constrained by parent flex bounds to inherit dynamic sibling height */}
             <div className="lg:absolute lg:inset-0 bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-full w-full">
               <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
               <div className="p-5 border-b border-white/40 bg-white/20 backdrop-blur-md relative z-10 flex-shrink-0">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selected ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)]' : 'bg-slate-300'}`} />
                    Vendor Dossier
                  </h3>
               </div>
               
               <div className="p-6 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                  {!selected ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <FiSearch size={48} className="mb-4" />
                      <p className="font-bold text-sm tracking-wide">Select a vendor</p>
                      <p className="text-xs font-semibold mt-1">to view detailed contact intel</p>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="mb-6 pb-6 border-b border-white/40">
                         <h2 className="text-2xl font-black text-slate-800 leading-tight drop-shadow-sm">{selected.company_name}</h2>
                         <div className="inline-block mt-3 px-3 py-1 bg-white/50 border border-white/60 rounded-lg shadow-sm">
                           <p className="text-xs font-black font-mono text-indigo-600 line-clamp-1">{selected.sup_code}</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { label: 'Address', value: selected.address },
                          { label: 'Telephone', value: selected.phone },
                          { label: 'Fax Number', value: selected.fax_no },
                          { label: 'Mobile Device', value: selected.mobile_phone },
                          { label: 'Contact Email', value: selected.email },
                          { label: 'Corporate Site', value: selected.web_site },
                          { label: 'Representative', value: selected.contact_person },
                          { label: 'Position / Role', value: selected.position },
                          { label: 'Apparent Gender', value: selected.gender }
                        ].map((item, idx) => (
                          <div key={idx} className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{item.label}</p>
                            <p className="text-sm font-bold text-slate-800 break-words">{item.value || <span className="text-slate-400 font-semibold italic">Unspecified</span>}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Dynamic Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgb(0,0,0,0.15)] rounded-[2.5rem] w-full max-w-4xl relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-white/10 pointer-events-none" />
            
            {/* Modal Internal Scroll container */}
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar p-6 lg:p-8 relative z-10">
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm z-20 -mt-4 -mx-4 lg:-mt-2 lg:-mx-2">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editing ? 'Modify Vendor Profile' : 'Register New Vendor'}</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Supplier Database Entry</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center text-slate-500 transition-colors shadow-sm border border-white/60">
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column Data */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Supplier Identifier *</label>
                      <input 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.sup_code} onChange={(e) => handleChange('sup_code', e.target.value)} required 
                        placeholder="e.g. VEND-001"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Company / Corporate Name *</label>
                      <input 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} required 
                        placeholder="Registrant Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Physical Address</label>
                      <input 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.address} onChange={(e) => handleChange('address', e.target.value)} 
                        placeholder="Headquarters Location"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Landline Telephone</label>
                      <input 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} 
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Fax Number</label>
                      <input 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.fax_no} onChange={(e) => handleChange('fax_no', e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Right Column Data */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Mobile / Direct Line</label>
                      <input 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.mobile_phone} onChange={(e) => handleChange('mobile_phone', e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.email} onChange={(e) => handleChange('email', e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Corporate Website</label>
                      <input 
                        className="w-full bg-white/40 focus:bg-white/60 text-slate-800 text-sm font-bold rounded-2xl border border-white/50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                        value={form.web_site} onChange={(e) => handleChange('web_site', e.target.value)} 
                        placeholder="https://"
                      />
                    </div>
                    
                    <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1 mb-2">Representative Intel</h4>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Primary Contact Name</label>
                        <input 
                          className="w-full bg-white/60 focus:bg-white text-slate-800 text-sm font-bold rounded-xl border border-white/60 px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                          value={form.contact_person} onChange={(e) => handleChange('contact_person', e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Position</label>
                          <input 
                            className="w-full bg-white/60 focus:bg-white text-slate-800 text-sm font-bold rounded-xl border border-white/60 px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                            value={form.position} onChange={(e) => handleChange('position', e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 pl-2">Gender</label>
                          <select 
                            className="w-full bg-white/60 focus:bg-white text-slate-800 text-sm font-bold rounded-xl border border-white/60 px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner appearance-none custom-select cursor-pointer" 
                            value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-white/40 sticky bottom-0 bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-[0_-4px_20px_rgb(0,0,0,0.03)] -mx-4 lg:-mx-2">
                  <button type="button" className="px-6 py-3 rounded-xl bg-white/50 hover:bg-white/80 text-slate-600 font-black text-[11px] uppercase tracking-wider transition-colors shadow-sm border border-white/60" onClick={() => setShowModal(false)}>Cancel Processing</button>
                  <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-[0_8px_20px_rgba(79,70,229,0.3)]" disabled={loading}>
                    {loading ? 'Transmitting...' : (editing ? 'Overwrite Database' : 'Register Vendor')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
