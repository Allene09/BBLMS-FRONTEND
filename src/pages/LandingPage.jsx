import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  PiBooks as FiBook, PiUsersThree as FiUsers, PiArrowCircleRight as FiArrowRightCircle, PiCalendarCheck as FiCalendar,
  PiChartBar as FiBarChart2, PiShieldCheck as FiShield, PiList as FiMenu, PiX as FiX, PiCheck as FiCheck,
  PiArrowRight as FiArrowRight, PiEnvelopeSimple as FiMail, PiPhone as FiPhone, PiMapPin as FiMapPin, PiClock as FiClock,
  PiTrendUp as FiTrendingUp, PiDatabase as FiDatabase, PiGlobe as FiGlobe, PiStar as FiStar,
} from 'react-icons/pi';

const features = [
  {
    icon: FiBook,
    title: 'Smart Book Catalog',
    description: 'Manage thousands of library items with barcode scanning, advanced search, and detailed metadata tracking.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: FiUsers,
    title: 'Borrower Management',
    description: 'Maintain complete borrower profiles for Students, Faculty, and others — with full loan history and status tracking.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: FiArrowRightCircle,
    title: 'Checkout & Check-in',
    description: 'Streamline the lending process with barcode scanning for instant book and borrower lookup.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: FiCalendar,
    title: 'Reservation System',
    description: 'Allow borrowers to reserve items in advance with automatic expiry and fulfillment tracking.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    icon: FiBarChart2,
    title: 'Analytics Dashboard',
    description: 'Get real-time insights on loans, overdue items, fines, and overall library usage statistics.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
  {
    icon: FiShield,
    title: 'Role-Based Access',
    description: 'Secure multi-level access control for Admins, Librarians, Faculty, and Students.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
];

const stats = [
  { key: 'totalBooks',     label: 'Books Catalogued',  icon: FiBook },
  { key: 'totalBorrowers', label: 'Active Borrowers',   icon: FiUsers },
  { value: '99.9%',        label: 'System Uptime',      icon: FiTrendingUp },
  { value: '100%',         label: 'Made for BISU',      icon: FiStar },
];

const steps = [
  {
    step: '01',
    title: 'Log In to Your Portal',
    description: 'Access with your institutional credentials. Role-based access ensures each user sees exactly what they need.',
    icon: FiShield,
  },
  {
    step: '02',
    title: 'Manage Your Collection',
    description: 'Add, edit, and track library items with barcode scanning. Organize by category, location, and circulation type.',
    icon: FiBook,
  },
  {
    step: '03',
    title: 'Process Transactions',
    description: 'Handle checkouts, returns, reservations, and fine collection seamlessly with real-time availability updates.',
    icon: FiArrowRightCircle,
  },
];

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featRef,  featVisible]  = useInView();
  const [statsRef, statsVisible] = useInView();
  const [stepsRef, stepsVisible] = useInView();
  const [aboutRef, aboutVisible] = useInView();
  const [ctaRef,   ctaVisible]   = useInView();
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(r => setLiveStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="BISU Bilar Library Logo"
                className="w-10 h-10 object-contain drop-shadow-md"
              />
              <div className="leading-tight">
                <span className={`font-extrabold text-sm block ${scrolled ? 'text-gray-900' : 'text-white'}`}>BISU BILAR</span>
                <span className={`text-xs block ${scrolled ? 'text-gray-400' : 'text-blue-200'}`}>Library Management</span>
              </div>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {['#', '#features', '#how-it-works', '#about'].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors ${
                    scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-blue-100 hover:text-white'
                  }`}
                >
                  {['Home', 'Features', 'How It Works', 'About'][i]}
                </a>
              ))}
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                state={{ showSignup: true }}
                className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                  scrolled ? 'text-blue-600 hover:bg-blue-50' : 'text-white hover:bg-white/10'
                }`}
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="text-sm font-bold px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-px"
              >
                Sign In →
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-xl">
            {['#', '#features', '#how-it-works', '#about'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="block text-sm text-gray-700 py-2.5 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {['Home', 'Features', 'How It Works', 'About'][i]}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <Link
                to="/login"
                className="block text-center text-sm font-bold px-4 py-3 rounded-xl bg-blue-600 text-white mt-2"
                onClick={() => setMenuOpen(false)}
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen relative overflow-hidden flex items-center" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1a1a3e 100%)',
      }}>
        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse at 15% 50%, rgba(59,130,246,0.25) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(99,102,241,0.25) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(16,185,129,0.12) 0%, transparent 45%)
          `
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px'
        }} />
        {/* Animated floating orbs */}
        <div className="absolute top-1/4 left-[12%] w-52 h-52 rounded-full pointer-events-none anim-orb"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.13), transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-[10%] w-40 h-40 rounded-full pointer-events-none anim-orb d-500"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.13), transparent 70%)', animationDuration: '13s' }} />
        <div className="absolute top-3/4 left-1/2 w-28 h-28 rounded-full pointer-events-none anim-orb d-300"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)', animationDuration: '16s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left content */}
            <div>

              <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6 anim-fade-up d-100">
                BISU BILAR Library
                <span className="block mt-1" style={{
                  background: 'linear-gradient(90deg, #60a5fa, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Management System
                </span>
              </h1>

              <p className="text-lg leading-relaxed mb-10 max-w-lg anim-fade-up d-200" style={{ color: '#93c5fd' }}>
                Elevating campus library operations through digital innovation. Experience a powerful, easy-to-use platform designed exclusively for BISU Bilar to seamlessly manage book inventories, track borrower activity, and streamline reservations.
              </p>

              <div className="flex flex-wrap gap-4 mb-12 anim-fade-up d-300">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 font-bold text-white rounded-xl transition-all hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                  }}
                >
                  Get Started <FiArrowRight size={18} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl border transition-all hover:-translate-y-1"
                  style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)' }}
                >
                  Explore Features
                </a>
              </div>

              {/* Mini stats */}
              <div className="flex flex-wrap gap-8 anim-fade-up d-400">
                {[
                  { icon: FiBook,       label: 'Books Tracked', value: liveStats ? Number(liveStats.totalBooks).toLocaleString()     : '…' },
                  { icon: FiUsers,      label: 'Borrowers',     value: liveStats ? Number(liveStats.totalBorrowers).toLocaleString() : '…' },
                  { icon: FiTrendingUp, label: 'Active Loans',  value: liveStats ? Number(liveStats.activeLoans).toLocaleString()    : '…' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                      <Icon style={{ color: '#60a5fa' }} size={15} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{value}</p>
                      <p className="text-xs leading-tight text-white">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dual Logo 360° Coin Flip */}
            <div className="hidden lg:flex items-center justify-center anim-fade-right d-200">
              <div className="relative flex items-center justify-center" style={{ width: '750px', height: '750px' }}>

                {/* Outer ambient glow */}
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.12) 45%, transparent 70%)',
                  filter: 'blur(20px)',
                }} />

                {/* Spinning dashed orbit rings */}
                <div className="absolute rounded-full border border-dashed" style={{
                  width: '700px', height: '700px',
                  borderColor: 'rgba(96,165,250,0.18)',
                  animation: 'spinRingCW 18s linear infinite',
                }} />
                <div className="absolute rounded-full border" style={{
                  width: '650px', height: '650px',
                  borderColor: 'rgba(167,139,250,0.12)',
                  animation: 'spinRingCCW 24s linear infinite',
                }} />

                {/* Dot accents on the outer ring */}
                {[0, 90, 180, 270].map((deg) => (
                  <div
                    key={deg}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: 'rgba(96,165,250,0.5)',
                      top: `calc(50% - 4px + ${Math.sin((deg * Math.PI) / 180) * 365}px)`,
                      left: `calc(50% - 4px + ${Math.cos((deg * Math.PI) / 180) * 365}px)`,
                      boxShadow: '0 0 8px rgba(96,165,250,0.8)',
                    }}
                  />
                ))}

                {/* 3D coin-flip wrapper */}
                <div style={{ perspective: '1800px' }}>
                  <div style={{
                    width: '540px',
                    height: '540px',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    animation: 'spin360 4s linear infinite',
                  }}>

                    {/* Front face — Library Management System logo */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}>
                      <img
                        src="/logo.png"
                        alt="BISU Bilar Library Management System"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 0 28px rgba(59,130,246,0.65)) drop-shadow(0 4px 16px rgba(0,0,0,0.4))',
                        }}
                      />
                    </div>

                    {/* Back face — BISU University Seal (rotated 180° so it shows on the back) */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}>
                      <img
                        src="/bisu.png"
                        alt="Bohol Island State University"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 0 28px rgba(124,58,237,0.65)) drop-shadow(0 4px 16px rgba(0,0,0,0.4))',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Label beneath */}
                <div className="absolute -bottom-8 left-0 right-0 flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(148,163,184,0.7)', letterSpacing: '0.15em' }}>
                    BISU Bilar Campus
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46C480 52 600 44 720 38C840 32 960 28 1080 30C1200 32 1320 40 1380 44L1440 48V72H0V0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-white" ref={featRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${featVisible ? 'anim-fade-up' : 'opacity-0'}`}>
            <span className="inline-block text-blue-600 text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full bg-blue-50">
              Features
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Everything Your Library Needs</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              A complete suite of tools designed to modernize how BISU Bilar manages its library resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, fi) => (
              <div
                key={f.title}
                style={{ animationDelay: `${fi * 0.1}s` }}
                className={`group p-7 rounded-2xl border ${f.border} hover:shadow-xl transition-all duration-300 cursor-default bg-white hover:-translate-y-1 ${featVisible ? 'anim-fade-up' : 'opacity-0'}`}
              >
                <div className={`w-12 h-12 ${f.bg} ${f.border} border rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={f.color} size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-20 relative overflow-hidden" ref={statsRef} style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)',
      }}>
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, si) => (
              <div key={s.label} style={{ animationDelay: `${si * 0.15}s` }} className={`text-center group ${statsVisible ? 'anim-scale-in' : 'opacity-0'}`}>
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center border transition-colors group-hover:bg-blue-600/20"
                  style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }}>
                  <s.icon style={{ color: '#60a5fa' }} size={20} />
                </div>
                <p className="text-4xl font-black text-white mb-1">
                  {s.key && liveStats ? Number(liveStats[s.key]).toLocaleString() : s.value}
                </p>
                <p className="text-sm text-white">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-gray-50" ref={stepsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${stepsVisible ? 'anim-fade-up' : 'opacity-0'}`}>
            <span className="inline-block text-blue-600 text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full bg-blue-50">
              How It Works
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Simple. Powerful. Efficient.</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Get your library operations running smoothly in just three steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[33%] right-[33%] h-px border-t-2 border-dashed border-blue-200" />

            {steps.map((s, i) => (
              <div key={s.step} style={{ animationDelay: `${i * 0.15 + 0.1}s` }} className={`relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all ${stepsVisible ? 'anim-fade-up' : 'opacity-0'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff' }}>
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                    <s.icon className="text-blue-600" size={18} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-24 bg-white" ref={aboutRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={aboutVisible ? 'anim-fade-left' : 'opacity-0'}>
              <span className="inline-block text-blue-600 text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full bg-blue-50">
                About
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Built for BISU<br />Bilar Campus
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                The BISU Bilar Library Management System is purpose-built for the Bohol Island State University - Bilar Campus, designed to replace manual processes with a streamlined digital solution tailored to the campus community.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                Our system supports multiple user roles — Administrators, Librarians, Faculty, and Students — each with tailored access and functionality to meet their specific needs.
              </p>
              <div className="space-y-3">
                {[
                  'Barcode scanner integration for fast, accurate transactions',
                  'Automated fine calculation for overdue items',
                  'Complete audit trail of all library transactions',
                  'Multi-role access with granular permission control',
                  'Supplier management and acquisition tracking',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiCheck className="text-emerald-600" size={10} />
                    </div>
                    <span className="text-gray-700 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl p-10 border border-blue-100 ${aboutVisible ? 'anim-fade-right d-200' : 'opacity-0'}`} style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)' }}>
              <div className="space-y-6">
                {[
                  { icon: FiDatabase, title: 'Centralized Database', desc: 'All library data in one secure SQLite database with full backup capability and zero reliance on external servers.' },
                  { icon: FiGlobe, title: 'Web-Based Platform', desc: 'Access from any browser — no installation required. Works seamlessly on desktop and mobile devices.' },
                  { icon: FiShield, title: 'Secure & Reliable', desc: 'JWT authentication, role-based access control, and industry-standard credential storage protect your data.' },
                  { icon: FiClock, title: 'Real-Time Updates', desc: 'Live tracking of book availability, borrower status, and transaction history keeps everything in sync.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 border border-blue-100">
                      <Icon className="text-blue-600" size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm mb-0.5">{title}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden" ref={ctaRef} style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)',
      }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)`
        }} />
        <div className={`max-w-4xl mx-auto px-4 text-center relative ${ctaVisible ? 'anim-scale-in' : 'opacity-0'}`}>
          <img
            src="/logo.png"
            alt="BISU Bilar Library Logo"
            className="w-24 h-24 object-contain mx-auto mb-6 drop-shadow-2xl"
          />
          <h2 className="text-4xl font-extrabold text-white mb-5 tracking-tight">
            Ready to Modernize<br />Your Library?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Access the BISU Bilar Library Management System portal and experience the difference digital management makes for students and staff alike.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-9 py-4 bg-white text-blue-700 font-extrabold rounded-2xl hover:bg-blue-50 transition-all hover:-translate-y-1 shadow-2xl shadow-blue-900/30 text-base"
          >
            Access the Portal <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0a0f1e' }} className="text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/logo.png"
                  alt="BISU Bilar Library Logo"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <p className="text-white font-extrabold text-sm">BISU — BILAR LMS</p>
                  <p className="text-xs text-white">Library Management System</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed max-w-xs text-white">
                A modern digital library management solution purpose-built for Bohol Island State University — Bilar Campus.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-white font-bold text-sm mb-5">Quick Links</p>
              <div className="space-y-3">
                {[
                  { href: '#features', label: 'Features' },
                  { href: '#how-it-works', label: 'How It Works' },
                  { href: '#about', label: 'About' },
                  { href: '/login', label: 'Staff Portal', isLink: true },
                ].map(({ href, label, isLink }) =>
                  isLink ? (
                    <Link key={label} to={href} className="block text-sm hover:text-white transition">{label}</Link>
                  ) : (
                    <a key={label} href={href} className="block text-sm hover:text-white transition">{label}</a>
                  )
                )}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-white font-bold text-sm mb-5">Contact</p>
              <div className="space-y-3">
                {[
                  { icon: FiMapPin, text: 'Bilar, Bohol, Philippines 6317' },
                  { icon: FiMail, text: 'library@bisu-bilar.edu.ph' },
                  { icon: FiPhone, text: '+63 (038) 000-0000' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2.5 text-sm">
                    <Icon size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-white">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs text-white">© 2026 BISU Bilar Library Management System. All rights reserved.</p>
            <p className="text-xs text-white">Bohol Island State University — Bilar Campus</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
