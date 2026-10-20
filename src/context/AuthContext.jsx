import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionVariant, setTransitionVariant] = useState('loading');

  // Show the full-screen transition animation for `ms` milliseconds
  const showTransition = useCallback((variant, ms = 3000) => {
    return new Promise((resolve) => {
      setTransitionVariant(variant);
      setTransitioning(true);
      setTimeout(() => {
        setTransitioning(false);
        resolve();
      }, ms);
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      api.get('/auth/me').then((res) => {
        if (String(res.data?.status || 'APPROVED').toUpperCase() !== 'APPROVED') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          return;
        }
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }).catch((err) => {
        // Only force logout on 401 (invalid/expired token).
        // Network errors or server hiccups should keep the user logged in.
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Synchronize auth state across multiple tabs
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        // If the token changes (logged into a different account or logged out in another tab), reload the page to sync state
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (user_id, password) => {
    const res = await api.post('/auth/login', { user_id, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading, transitioning, transitionVariant, showTransition }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
