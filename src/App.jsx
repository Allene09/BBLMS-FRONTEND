import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Borrowers from './pages/Borrowers';
import Suppliers from './pages/Suppliers';
import Checkout from './pages/Checkout';
import Checkin from './pages/Checkin';
import Reservations from './pages/Reservations';
import Users from './pages/Users';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-lg text-gray-500">Loading...</div></div>;
  return user ? children : <Navigate to="/login" />;
}

// Only allow users whose access_right is in the allowed list
function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.access_right)) return <Navigate to="/books" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<RoleRoute roles={['ADMIN','LIBRARIAN']}><Dashboard /></RoleRoute>} />
        <Route path="books" element={<Books />} />
        <Route path="borrowers" element={<RoleRoute roles={['ADMIN','LIBRARIAN']}><Borrowers /></RoleRoute>} />
        <Route path="suppliers" element={<RoleRoute roles={['ADMIN','LIBRARIAN']}><Suppliers /></RoleRoute>} />
        <Route path="checkout" element={<RoleRoute roles={['ADMIN','LIBRARIAN']}><Checkout /></RoleRoute>} />
        <Route path="checkin" element={<RoleRoute roles={['ADMIN','LIBRARIAN']}><Checkin /></RoleRoute>} />
        <Route path="reservations" element={<RoleRoute roles={['ADMIN','LIBRARIAN','FACULTY']}><Reservations /></RoleRoute>} />
        <Route path="users" element={<RoleRoute roles={['ADMIN']}><Users /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
