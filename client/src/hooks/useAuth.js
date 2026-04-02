import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedPwd = localStorage.getItem('bill_auth');
    if (savedPwd) {
      login(savedPwd).catch(() => logout());
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (password) => {
    setError(null);
    try {
      await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      localStorage.setItem('bill_auth', password);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('bill_auth');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loading, error, login, logout };
}