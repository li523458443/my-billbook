let authToken = null;

export function setToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

export function getToken() {
    if (!authToken) {
        authToken = localStorage.getItem('token');
    }
    return authToken;
}

export async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(endpoint, { ...options, headers });
    if (response.status === 401) {
        setToken(null);
        // 不自动跳转，由调用方处理
        throw new Error('登录已过期，请重新登录');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}