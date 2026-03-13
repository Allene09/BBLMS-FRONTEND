import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import LandingPage from './pages/LandingPage';
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
  if (loading) return <LoadingScreen message="Verifying your session..." />;
  return user ? children : <Navigate to="/login" />;
}

function TransitionOverlay() {
  const { transitioning, transitionVariant } = useAuth();
  if (!transitioning) return null;
  const messages = { login: 'Welcome back!', logout: 'Signing you out...' };
  return <LoadingScreen variant={transitionVariant} message={messages[transitionVariant]} />;
}

// Only allow users whose access_right is in the allowed list
function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.access_right)) return <Navigate to="/app/books" />;
  return children;
}

export default function App() {
  return (
    <>
    <TransitionOverlay />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
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
    </>
  );
}

