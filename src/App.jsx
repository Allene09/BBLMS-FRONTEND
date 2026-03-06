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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="books" element={<Books />} />
        <Route path="borrowers" element={<Borrowers />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkin" element={<Checkin />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
