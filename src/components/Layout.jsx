import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiBook, FiUsers, FiTruck, FiLogOut,
  FiArrowRightCircle, FiArrowLeftCircle, FiCalendar, FiSettings, FiMenu, FiX
} from 'react-icons/fi';
import { useState } from 'react';

// Which roles can see each nav item. Empty array = all roles.
const navItems = [
  { path: '/', icon: FiHome, label: 'Dashboard', end: true,  roles: ['ADMIN', 'LIBRARIAN'] },
  { path: '/books', icon: FiBook, label: 'Library Items',    roles: [] },
  { path: '/borrowers', icon: FiUsers, label: 'Borrowers',   roles: ['ADMIN', 'LIBRARIAN'] },
  { path: '/suppliers', icon: FiTruck, label: 'Suppliers',   roles: ['ADMIN', 'LIBRARIAN'] },
  { path: '/checkout', icon: FiArrowRightCircle, label: 'Check-out', roles: ['ADMIN', 'LIBRARIAN'] },
  { path: '/checkin', icon: FiArrowLeftCircle, label: 'Check-in',   roles: ['ADMIN', 'LIBRARIAN'] },
  { path: '/reservations', icon: FiCalendar, label: 'Reservations', roles: ['ADMIN', 'LIBRARIAN', 'FACULTY'] },
  { path: '/users', icon: FiSettings, label: 'System Users', roles: ['ADMIN'] },
];

function canSee(item, userRole) {
  return item.roles.length === 0 || item.roles.includes(userRole);
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-wide">BISU - BILAR</h1>
              <p className="text-blue-300 text-xs mt-0.5">Library Management System</p>
            </div>
            <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.filter((item) => canSee(item, user?.access_right)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700/60 text-white border-r-3 border-amber-400'
                    : 'text-blue-200 hover:bg-blue-700/40 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.username?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-blue-300 truncate">{user?.access_right}</p>
            </div>
            <button onClick={handleLogout} className="text-blue-300 hover:text-white" title="Logout">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={22} />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">
            Welcome, <span className="font-semibold text-gray-700">{user?.username}</span>
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
