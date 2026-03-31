import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查 localStorage 中是否有密码
    const password = localStorage.getItem('bill_auth');
    if (password) {
      // 可以尝试调用一个简单接口验证密码是否有效，但为了简化，直接认为有效
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (password) => {
    await apiLogin(password);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('bill_auth');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}