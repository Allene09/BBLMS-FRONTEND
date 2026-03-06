import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSearch, FiX, FiPrinter } from 'react-icons/fi';

const emptyBook = {
  title: '', author: '', co_author: '', type: 'Book', publisher: '', place: '',
  date_published: '', volume: '', series: '', category: '', format: '', editor: '',
  illustrator: '', pages: '', isbn: '', physical_desc: '', accession_no: '',
  call_no: '', barcode: '', location: '', circulation_type: 'Loanable',
  price: 0, value: 0, purchased_date: '', evaluated_date: '', acquisition_date: '',
  copies_available: 1,
};

export default function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyBook });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await api.get('/books', { params: { search: search || undefined } });
      setBooks(res.data);
    } catch (err) {
      toast.error('Failed to load books');
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleNew = () => {
    setForm({ ...emptyBook });
    setEditing(false);
    setShowModal(true);
  };

  const handleEdit = () => {
    if (!selected) return toast.error('Select a book first');
    setForm({ ...selected });
    setEditing(true);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selected) return toast.error('Select a book first');
    if (!window.confirm(`Delete "${selected.title}"?`)) return;
    try {
      await api.delete(`/books/${selected.id}`);
      toast.success('Book deleted');
      setSelected(null);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/books/${form.id}`, form);
        toast.success('Book updated');
      } else {
        await api.post('/books', form);
        toast.success('Book added');
      }
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Library Items Management</h1>

      {/* Toolbar */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" onClick={handleNew}><FiPlus size={16} /> New</button>
          <button className="btn btn-warning" onClick={handleEdit}><FiEdit2 size={16} /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 size={16} /> Delete</button>
          <button className="btn btn-secondary" onClick={fetchBooks}><FiRefreshCw size={16} /> Refresh</button>

          <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                className="form-input pl-9 w-64"
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>

      {/* Content: Table + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className="card lg:col-span-2 overflow-hidden p-0">
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="data-table">
              <thead className="sticky top-0">
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Type</th>
                  <th>Barcode</th>
                  <th>Copies</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-8">No books found</td></tr>
                ) : books.map((book) => (
                  <tr
                    key={book.id}
                    className={selected?.id === book.id ? 'selected' : ''}
                    onClick={() => setSelected(book)}
                  >
                    <td className="font-medium max-w-xs truncate">{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.type}</td>
                    <td className="font-mono text-xs">{book.barcode || '-'}</td>
                    <td className="text-center">{book.copies_available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Panel */}
        <div className="card">
          <h3 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide">Detailed Information</h3>
          {selected ? (
            <div className="space-y-2 text-sm">
              {[
                ['Title', selected.title],
                ['Author', selected.author],
                ['Co-Author', selected.co_author],
                ['Type', selected.type],
                ['Publisher', selected.publisher],
                ['Place', selected.place],
                ['Date', selected.date_published],
                ['Volume', selected.volume],
                ['Series', selected.series],
                ['Category', selected.category],
                ['Format', selected.format],
                ['ISBN', selected.isbn],
                ['Accession No', selected.accession_no],
                ['Call No', selected.call_no],
                ['Barcode', selected.barcode],
                ['Location', selected.location],
                ['Circulation', selected.circulation_type],
                ['Copies', selected.copies_available],
                ['Price', `₱${selected.price || 0}`],
              ].map(([label, val]) => (
                <div key={label} className="flex">
                  <span className="w-28 text-gray-500 font-medium shrink-0">{label}:</span>
                  <span className="text-gray-800">{val || 'none'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Select a book to view details</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Book' : 'New Book'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Author</label>
                  <input className="form-input" value={form.author} onChange={(e) => handleChange('author', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Co-Author</label>
                  <input className="form-input" value={form.co_author} onChange={(e) => handleChange('co_author', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
                    <option>Book</option>
                    <option>Journal</option>
                    <option>Magazine</option>
                    <option>Thesis</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Publisher</label>
                  <input className="form-input" value={form.publisher} onChange={(e) => handleChange('publisher', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">ISBN</label>
                  <input className="form-input" value={form.isbn} onChange={(e) => handleChange('isbn', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Barcode</label>
                  <input className="form-input" value={form.barcode} onChange={(e) => handleChange('barcode', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Accession No</label>
                  <input className="form-input" value={form.accession_no} onChange={(e) => handleChange('accession_no', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Call No</label>
                  <input className="form-input" value={form.call_no} onChange={(e) => handleChange('call_no', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location} onChange={(e) => handleChange('location', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Circulation Type</label>
                  <select className="form-input" value={form.circulation_type} onChange={(e) => handleChange('circulation_type', e.target.value)}>
                    <option>Loanable</option>
                    <option>Room-Use Only</option>
                    <option>Reference</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Copies Available</label>
                  <input type="number" min="0" className="form-input" value={form.copies_available} onChange={(e) => handleChange('copies_available', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input className="form-input" value={form.category} onChange={(e) => handleChange('category', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Format</label>
                  <input className="form-input" value={form.format} onChange={(e) => handleChange('format', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Price (₱)</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={form.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="form-label">Value (₱)</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={form.value} onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editing ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
