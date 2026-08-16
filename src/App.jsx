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
import OverdueMonitoring from './pages/OverdueMonitoring';
import BorrowRecords from './pages/BorrowRecords';
import Reports from './pages/Reports';
import Reservations from './pages/Reservations';
import Users from './pages/Users';
import Profile from './pages/Profile';
import MyBorrows from './pages/MyBorrows';
import FinePayment from './pages/FinePayment';

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

  const defaultRouteByRole = {
    CIRCULATION_IN_CHARGE: '/app/checkout',
    STAFF: '/app/books',
    STUDENT: '/app/my-borrows',
    BORROWER: '/app/my-borrows',
  };

  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.access_right)) {
    return <Navigate to={defaultRouteByRole[user.access_right] || '/app'} />;
  }
  return children;
}

export default function App() {
  const adminRoles = ['ADMIN', 'ADMINISTRATOR'];
  const adminLibrarianRoles = [...adminRoles, 'LIBRARIAN'];
  const circulationRoles = ['LIBRARIAN', 'CIRCULATION_IN_CHARGE'];
  const inventoryRoles = [...adminRoles, 'LIBRARIAN', 'STAFF', 'STUDENT', 'BORROWER'];
  const librarianOnlyRoles = ['LIBRARIAN'];

  return (
    <>
    <TransitionOverlay />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<RoleRoute roles={adminLibrarianRoles}><Dashboard /></RoleRoute>} />
        <Route path="books" element={<RoleRoute roles={inventoryRoles}><Books /></RoleRoute>} />
        <Route path="borrowers" element={<RoleRoute roles={librarianOnlyRoles}><Borrowers /></RoleRoute>} />
        <Route path="suppliers" element={<RoleRoute roles={['STAFF']}><Suppliers /></RoleRoute>} />
        <Route path="checkout" element={<RoleRoute roles={circulationRoles}><Checkout /></RoleRoute>} />
        <Route path="checkin" element={<RoleRoute roles={circulationRoles}><Checkin /></RoleRoute>} />
        <Route path="overdue" element={<RoleRoute roles={circulationRoles}><OverdueMonitoring /></RoleRoute>} />
        <Route path="records" element={<RoleRoute roles={circulationRoles}><BorrowRecords /></RoleRoute>} />
        <Route path="fine-payments" element={<RoleRoute roles={circulationRoles}><FinePayment /></RoleRoute>} />
        <Route path="reports" element={<RoleRoute roles={adminLibrarianRoles}><Reports /></RoleRoute>} />
        <Route path="reservations" element={<RoleRoute roles={librarianOnlyRoles}><Reservations /></RoleRoute>} />
        <Route path="profile" element={<Profile />} />
        <Route path="my-borrows" element={<RoleRoute roles={['STUDENT', 'BORROWER']}><MyBorrows /></RoleRoute>} />
        <Route path="users" element={<RoleRoute roles={adminRoles}><Users /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  );
}

