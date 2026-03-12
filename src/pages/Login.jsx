import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { PiSignIn as FiLogIn, PiBooks as FiBook, PiUsersThree as FiUsers, PiArrowCircleRight as FiArrowRightCircle, PiCalendarCheck as FiCalendar, PiArrowLeft as FiArrowLeft, PiEye as FiEye, PiEyeSlash as FiEyeOff, PiShieldCheck as FiShield, PiClock as FiClock, PiLightning as FiZap, PiUserPlus as FiUserPlus, PiX as FiX, PiCheck as FiCheck } from 'react-icons/pi';

const highlights = [
  { icon: FiBook,             text: 'Manage your entire book catalog with ease', color: '#60a5fa' },
  { icon: FiUsers,            text: 'Track borrowers and their loan history', color: '#34d399' },
  { icon: FiArrowRightCircle, text: 'Process checkouts and returns instantly', color: '#f472b6' },
  { icon: FiCalendar,         text: 'Manage reservations and fine collections', color: '#fbbf24' },
];

const emptySignup = {
  id_no: '', firstname: '', lastname: '', password: '', confirm_password: '',
  mobile_phone: '', phone: '', email: '', address: '', notes: '', type: 'STUDENT'
};

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
  const location = useLocation();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sign up states - check if navigated with showSignup state
  const [showSignup, setShowSignup] = useState(location.state?.showSignup || false);
  const [signupForm, setSignupForm] = useState({ ...emptySignup });
  const [signupLoading, setSignupLoading] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);

  const stats = [
    { icon: FiBook,  key: 'totalBooks',     label: 'Books' },
    { icon: FiUsers, key: 'totalBorrowers', label: 'Users' },
    { icon: FiZap,   value: '99.9%',        label: 'Uptime' },
  ];

  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    setMounted(true);
    api.get('/stats').then(r => setLiveStats(r.data)).catch(() => {});
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

  const handleSignupChange = (field, value) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!signupForm.id_no || !signupForm.firstname || !signupForm.lastname || !signupForm.password) {
      return toast.error('Please fill in all required fields');
    }
    if (signupForm.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (signupForm.password !== signupForm.confirm_password) {
      return toast.error('Passwords do not match');
    }

    setSignupLoading(true);
    try {
      await api.post('/auth/signup', signupForm);
      toast.success('Account created successfully! You can now sign in.');
      setShowSignup(false);
      setSignupForm({ ...emptySignup });
      setUserId(signupForm.id_no); // Pre-fill login with new ID
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sign up failed');
    } finally {
      setSignupLoading(false);
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
            <img
              src="/logo.png"
              alt="BISU Bilar Library Logo"
              className="w-12 h-12 object-contain transition-transform group-hover:scale-105 drop-shadow-xl"
            />
            <div className="leading-tight">
              <p className="text-white font-extrabold text-lg tracking-tight">BISU BILAR</p>
              <p className="text-sm" style={{ color: '#64748b' }}>Library Management System</p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className={`relative transition-all duration-700 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>

          <h2 className="text-5xl font-black text-white mb-5 leading-tight tracking-tight">
            BISU BILAR Library<br />
            <span className="relative" style={{
              background: 'linear-gradient(90deg, #60a5fa, #34d399, #60a5fa)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}>
              Management 
              System.
            </span>
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: '#94a3b8', maxWidth: '400px' }}>
            Seamlessly oversee book inventories, track borrower activity, process active loans, and streamline reservations through a single, sophisticated, and user-friendly platform.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mb-10">
            {stats.map(({ icon: Icon, value, key, label }, idx) => (
              <div
                key={label}
                className={`transition-all duration-500`}
                style={{ transitionDelay: `${200 + idx * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: '#60a5fa' }} />
                  <span className="text-2xl font-bold text-white">
                    {key && liveStats ? Number(liveStats[key]).toLocaleString() : (value ?? '…')}
                  </span>
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
          {/* Back button */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-all"
              title="Back to Home"
            >
              <FiArrowLeft size={18} />
            </Link>
          </div>

          {/* Welcome section */}
          <div className="mb-8">
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

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors inline-flex items-center gap-1"
              >
                <FiUserPlus size={14} />
                Sign Up
              </button>
            </p>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8 font-medium">
            Bohol Island State University — Bilar Campus
          </p>
        </div>
      </div>

      {/* Sign Up Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSignup(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalSlideIn 0.25s ease-out' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-xl">
              <div className="border-l-4 border-blue-500 pl-4">
                <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fill in your information to register</p>
              </div>
              <button 
                onClick={() => setShowSignup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSignupSubmit} className="p-6 space-y-8">
              {/* Account Info Section */}
              <div className="border-l-4 border-blue-400 pl-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  </div>
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">ID No / Student ID <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50/50"
                      placeholder="e.g., 2024-0001"
                      value={signupForm.id_no}
                      onChange={(e) => handleSignupChange('id_no', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Password <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <input
                          type={showSignupPw ? 'text' : 'password'}
                          className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50/50"
                          placeholder="Min 6 characters"
                          value={signupForm.password}
                          onChange={(e) => handleSignupChange('password', e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowSignupPw(!showSignupPw)}
                        >
                          {showSignupPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
                      <input
                        type={showSignupPw ? 'text' : 'password'}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50/50"
                        placeholder="Repeat password"
                        value={signupForm.confirm_password}
                        onChange={(e) => handleSignupChange('confirm_password', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info Section */}
              <div className="border-l-4 border-emerald-400 pl-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FiUsers size={16} className="text-emerald-500" />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Firstname <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50"
                        placeholder="Enter firstname"
                        value={signupForm.firstname}
                        onChange={(e) => handleSignupChange('firstname', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Lastname <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50"
                        placeholder="Enter lastname"
                        value={signupForm.lastname}
                        onChange={(e) => handleSignupChange('lastname', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Mobile Phone</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50"
                        placeholder="e.g., 09123456789"
                        value={signupForm.mobile_phone}
                        onChange={(e) => handleSignupChange('mobile_phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50"
                        placeholder="Landline (optional)"
                        value={signupForm.phone}
                        onChange={(e) => handleSignupChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50"
                      placeholder="your.email@example.com"
                      value={signupForm.email}
                      onChange={(e) => handleSignupChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50"
                      placeholder="Complete address"
                      value={signupForm.address}
                      onChange={(e) => handleSignupChange('address', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50 appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                        value={signupForm.type}
                        onChange={(e) => handleSignupChange('type', e.target.value)}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY">Faculty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-gray-50/50"
                        placeholder="Additional notes (optional)"
                        value={signupForm.notes}
                        onChange={(e) => handleSignupChange('notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSignup(false)}
                  className="flex-1 py-3 px-6 text-gray-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="flex-1 py-3 px-6 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  style={{ 
                    background: signupLoading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: signupLoading ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
                  }}
                >
                  {signupLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

