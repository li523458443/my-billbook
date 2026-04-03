import { useState, useEffect } from 'react';
import { apiFetch, setToken } from '../services/api';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // 简单验证 token 是否有效（可选：调用一个验证接口）
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        setError(null);
        try {
            const data = await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            setToken(data.token);
            setIsAuthenticated(true);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (username, password) => {
        setError(null);
        try {
            await apiFetch('/api/register', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            // 注册成功后自动登录
            await login(username, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = () => {
        setToken(null);
        setIsAuthenticated(false);
    };

    return { isAuthenticated, loading, error, login, register, logout };
}