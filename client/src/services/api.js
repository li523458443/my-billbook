let token = null;

export function setToken(newToken) {
    token = newToken;
    if (newToken) {
        localStorage.setItem('token', newToken);
    } else {
        localStorage.removeItem('token');
    }
}

export function getToken() {
    if (!token) {
        token = localStorage.getItem('token');
    }
    return token;
}

export async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    const authToken = getToken();
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(endpoint, { ...options, headers });
    if (response.status === 401) {
        // token 失效，清除并跳转登录
        setToken(null);
        window.location.href = '/';
        throw new Error('登录已过期');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}