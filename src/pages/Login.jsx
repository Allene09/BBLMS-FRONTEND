import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLogIn, FiBook, FiUsers, FiArrowRightCircle, FiCalendar, FiArrowLeft, FiEye, FiEyeOff, FiShield, FiClock, FiZap } from 'react-icons/fi';

const highlights = [
  { icon: FiBook,             text: 'Manage your entire book catalog with ease', color: '#60a5fa' },
  { icon: FiUsers,            text: 'Track borrowers and their loan history', color: '#34d399' },
  { icon: FiArrowRightCircle, text: 'Process checkouts and returns instantly', color: '#f472b6' },
  { icon: FiCalendar,         text: 'Manage reservations and fine collections', color: '#fbbf24' },
];

const stats = [
  { icon: FiBook, value: '10K+', label: 'Books' },
  { icon: FiUsers, value: '5K+', label: 'Users' },
  { icon: FiZap, value: '99.9%', label: 'Uptime' },
];

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full opacity-20"
        style={{
          width: `${20 + i * 15}px`,
          height: `${20 + i * 15}px`,
          background: `linear-gradient(135deg, ${['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'][i]}, transparent)`,
          left: `${10 + i * 15}%`,
          top: `${15 + (i % 3) * 25}%`,
          animation: `float ${6 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
        }}
      />
    ))}
  </div>
);

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(140deg, #0f172a 0%, #1e3a5f 50%, #1a1a3e 100%)' }}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse at 10% 60%, rgba(37,99,235,0.25) 0%, transparent 55%),
            radial-gradient(ellipse at 90% 10%, rgba(99,102,241,0.25) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(6,182,212,0.15) 0%, transparent 45%)
          `,
          animation: 'pulse 8s ease-in-out infinite',
        }} />
        
        {/* Floating particles */}
        <FloatingParticles />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />

        {/* Top logo */}
        <div className={`relative transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300"
              style={{ 
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 8px 32px rgba(37,99,235,0.4)'
              }}>
              <FiBook className="text-white" size={22} />
            </div>
            <div className="leading-tight">
              <p className="text-white font-extrabold text-lg tracking-tight">BISU — BILAR</p>
              <p className="text-sm" style={{ color: '#64748b' }}>Library Management System</p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className={`relative transition-all duration-700 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
            style={{ 
              background: 'rgba(59,130,246,0.15)', 
              border: '1px solid rgba(59,130,246,0.3)', 
              color: '#93c5fd',
              backdropFilter: 'blur(8px)'
            }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Staff Portal
          </div>

          <h2 className="text-5xl font-black text-white mb-5 leading-tight tracking-tight">
            Your Library,<br />
            <span className="relative" style={{
              background: 'linear-gradient(90deg, #60a5fa, #34d399, #60a5fa)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}>
              Fully Digital.
            </span>
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: '#94a3b8', maxWidth: '400px' }}>
            Manage books, borrowers, loans, reservations, and more — all from one powerful, easy-to-use platform.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mb-10">
            {stats.map(({ icon: Icon, value, label }, idx) => (
              <div 
                key={label} 
                className={`transition-all duration-500`}
                style={{ transitionDelay: `${200 + idx * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: '#60a5fa' }} />
                  <span className="text-2xl font-bold text-white">{value}</span>
                </div>
                <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {highlights.map(({ icon: Icon, text, color }, idx) => (
              <div 
                key={text} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:translate-x-2 cursor-default group`}
                style={{ 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    boxShadow: `0 4px 16px ${color}20`
                  }}>
                  <Icon style={{ color }} size={18} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#cbd5e1' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className={`relative flex items-center justify-between transition-all duration-700 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <p className="text-xs" style={{ color: '#475569' }}>
            © 2026 BISU Bilar Library Management System
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
            <FiShield size={12} />
            <span>Secure Access</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-gradient-to-br from-white to-slate-50">
        {/* Back link (mobile only) */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
            <FiArrowLeft size={15} /> Back to Home
          </Link>
        </div>

        <div className={`max-w-md w-full mx-auto transition-all duration-700 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 8px 24px rgba(37,99,235,0.3)'
              }}>
              <FiBook className="text-white" size={22} />
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-lg">BISU — BILAR</p>
              <p className="text-sm text-gray-400">Library Management System</p>
            </div>
          </div>

          {/* Welcome section */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FiClock size={12} />
              Quick & Secure Login
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-base">Sign in to access the library portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User ID */}
            <div className="group">
              <label className="form-label flex items-center gap-2 text-gray-600 font-semibold text-sm mb-2">
                User ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input py-3.5 px-4 text-base transition-all duration-200 hover:border-blue-300"
                  style={{ borderRadius: '12px' }}
                  placeholder="Enter your User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="form-label flex items-center gap-2 text-gray-600 font-semibold text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input py-3.5 px-4 pr-12 text-base transition-all duration-200 hover:border-blue-300"
                  style={{ borderRadius: '12px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 text-white font-semibold text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-4 group"
              style={{ 
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(37,99,235,0.35)',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <FiLogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  Sign In to Portal
                </>
              )}
            </button>
          </form>

          {/* Hint */}
         

          <p className="text-center text-gray-400 text-sm mt-10 font-medium">
            Bohol Island State University — Bilar Campus
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

