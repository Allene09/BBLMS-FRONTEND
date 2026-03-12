import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLogIn, FiBook, FiUsers, FiArrowRightCircle, FiCalendar, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

const highlights = [
  { icon: FiBook,             text: 'Manage your entire book catalog with ease' },
  { icon: FiUsers,            text: 'Track borrowers and their loan history' },
  { icon: FiArrowRightCircle, text: 'Process checkouts and returns instantly' },
  { icon: FiCalendar,         text: 'Manage reservations and fine collections' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/app" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      toast.error('Please enter User ID and Password');
      return;
    }
    setLoading(true);
    try {
      const data = await login(userId, password);
      toast.success('Welcome back!');
      const role = data.user?.access_right;
      navigate(['ADMIN', 'LIBRARIAN'].includes(role) ? '/app' : '/app/books');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden anim-fade-left"
        style={{ background: 'linear-gradient(140deg, #0f172a 0%, #1e3a5f 50%, #1a1a3e 100%)' }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse at 10% 60%, rgba(37,99,235,0.2) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 10%, rgba(99,102,241,0.2) 0%, transparent 55%)
          `
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />

        {/* Top logo */}
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
              <FiBook className="text-white" size={20} />
            </div>
            <div className="leading-tight">
              <p className="text-white font-extrabold text-base">BISU — BILAR</p>
              <p className="text-xs" style={{ color: '#475569' }}>Library Management System</p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s infinite' }} />
            Staff Portal
          </div>

          <h2 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">
            Your Library,<br />
            <span style={{
              background: 'linear-gradient(90deg, #60a5fa, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Fully Digital.
            </span>
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: '#64748b', maxWidth: '380px' }}>
            Manage books, borrowers, loans, reservations, and more — all from one powerful, easy-to-use platform.
          </p>

          <div className="space-y-4">
            {highlights.map(({ icon: Icon, text }, hi) => (
              <div key={text} style={{ animationDelay: `${hi * 0.1 + 0.3}s` }} className="flex items-center gap-3 anim-fade-up">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Icon style={{ color: '#60a5fa' }} size={15} />
                </div>
                <p className="text-sm" style={{ color: '#94a3b8' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative">
          <p className="text-xs" style={{ color: '#1e293b' }}>
            © 2026 BISU Bilar Library Management System
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-white anim-fade-right">
        {/* Back link (mobile only) */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
            <FiArrowLeft size={15} /> Back to Home
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
              <FiBook className="text-white" size={20} />
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-base">BISU — BILAR</p>
              <p className="text-xs text-gray-400">Library Management System</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight anim-fade-up d-100">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-9 anim-fade-up d-200">Sign in to access the library portal.</p>

          <form onSubmit={handleSubmit} className="space-y-5 anim-fade-up d-300">
            {/* User ID */}
            <div>
              <label className="form-label">User ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3 text-sm mt-2"
              style={{ borderRadius: '10px', fontSize: '0.9rem' }}
            >
              <FiLogIn size={17} />
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-8 p-4 rounded-xl border border-blue-100 bg-blue-50">
            <p className="text-xs text-blue-700 font-semibold mb-1">Default Administrator Credentials</p>
            <p className="text-xs text-blue-600">
              User ID: <span className="font-bold font-mono">ADMIN</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;
              Password: <span className="font-bold font-mono">Admin@123</span>
            </p>
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            Bohol Island State University — Bilar Campus
          </p>
        </div>
      </div>
    </div>
  );
}

