import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PiHouseSimple as FiHome, PiBooks as FiBook, PiUsersThree as FiUsers, PiTruck as FiTruck, PiSignOut as FiLogOut,
  PiArrowCircleRight as FiArrowRightCircle, PiArrowCircleLeft as FiArrowLeftCircle, PiCalendarCheck as FiCalendar,
  PiGear as FiSettings, PiList as FiMenu, PiX as FiX, PiCaretRight as FiChevronRight, PiWarning as FiWarning,
  PiReceipt as FiReceipt, PiChartBar as FiChartBar, PiUserCircle as FiProfile,
} from 'react-icons/pi';
import { useState } from 'react';

const navItems = [
  { path: '/app',       icon: FiHome,             label: 'Dashboard',    end: true,  roles: ['ADMIN', 'ADMINISTRATOR', 'LIBRARIAN'] },
  { path: '/app/books', icon: FiBook,             label: 'Library Items',            roles: ['ADMIN', 'ADMINISTRATOR', 'LIBRARIAN', 'STAFF', 'STUDENT', 'BORROWER'] },
  { path: '/app/borrowers', icon: FiUsers,         label: 'Borrowers',               roles: ['LIBRARIAN'] },
  { path: '/app/suppliers', icon: FiTruck,         label: 'Suppliers',               roles: ['STAFF'] },
  { path: '/app/checkout',  icon: FiArrowRightCircle, label: 'Borrow Book',          roles: ['LIBRARIAN', 'CIRCULATION_IN_CHARGE'] },
  { path: '/app/checkin',   icon: FiArrowLeftCircle,  label: 'Return Book',          roles: ['LIBRARIAN', 'CIRCULATION_IN_CHARGE'] },
  { path: '/app/overdue',   icon: FiWarning,          label: 'Overdue Monitoring',   roles: ['LIBRARIAN', 'CIRCULATION_IN_CHARGE'] },
  { path: '/app/records',   icon: FiReceipt,          label: 'Borrow Records',       roles: ['LIBRARIAN', 'CIRCULATION_IN_CHARGE'] },
  { path: '/app/reports',   icon: FiChartBar,         label: 'Reports',              roles: ['ADMIN', 'ADMINISTRATOR', 'LIBRARIAN'] },
  { path: '/app/reservations', icon: FiCalendar,  label: 'Reservations',            roles: ['LIBRARIAN'] },
  { path: '/app/profile',   icon: FiProfile,        label: 'Profile',                roles: [] },
  { path: '/app/users',     icon: FiSettings,     label: 'System Users',             roles: ['ADMIN', 'ADMINISTRATOR'] },
];

function canSee(item, userRole) {
  return item.roles.length === 0 || item.roles.includes(userRole);
}

const roleColors = {
  ADMIN: 'bg-blue-500/20 text-blue-300',
  ADMINISTRATOR: 'bg-blue-500/20 text-blue-300',
  LIBRARIAN: 'bg-emerald-500/20 text-emerald-300',
  CIRCULATION_IN_CHARGE: 'bg-amber-500/20 text-amber-300',
  STAFF: 'bg-purple-500/20 text-purple-300',
  STUDENT: 'bg-cyan-500/20 text-cyan-300',
  BORROWER: 'bg-cyan-500/20 text-cyan-300',
};

export default function Layout() {
  const { user, logout, showTransition } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await showTransition('logout', 3000);
    logout();
    navigate('/login');
  };

  const avatarLetter = user?.username?.[0]?.toUpperCase() || 'U';
  const roleColor = roleColors[user?.access_right] || 'bg-gray-500/20 text-gray-300';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 flex flex-col
        transition-transform duration-250
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#0f172a' }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="BISU Bilar Library Logo"
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105 drop-shadow-lg"
            />
            <div className="leading-tight">
              <p className="text-white font-extrabold text-sm tracking-wide">BISU — BILAR</p>
              <p className="text-xs" style={{ color: '#334155' }}>Library System</p>
            </div>
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-white transition" onClick={() => setSidebarOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        {/* Nav label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#1e293b' }}>Navigation</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
          {navItems.filter((item) => canSee(item, user?.access_right)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'rgba(37,99,235,0.15)', boxShadow: 'inset 3px 0 0 #3b82f6' }
                : {}
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'group-hover:bg-slate-800'
                  }`}>
                    <item.icon size={15} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <FiChevronRight size={13} className="text-blue-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 p-2 rounded-xl group cursor-default" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-inner flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${roleColor}`}>
                {user?.access_right}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
            >
              <FiLogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 lg:px-6 shadow-sm flex-shrink-0">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu size={20} />
          </button>

          {/* Breadcrumb-style title area */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-gray-100">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                {avatarLetter}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.access_right}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ background: '#f8fafc' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
