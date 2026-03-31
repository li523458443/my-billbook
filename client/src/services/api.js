// client/src/services/api.js
const USE_MOCK = false;  // 改为 false

let authPassword = '';

export function setAuthPassword(password) {
    authPassword = password;
}

export async function apiFetch(endpoint, options = {}) {
    if (USE_MOCK) {
        // 模拟代码已注释，不再使用
        return { success: true };
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(authPassword && { 'X-Auth-Password': authPassword }),
        ...(options.headers || {}),
    };
    const response = await fetch(endpoint, { ...options, headers });
    if (response.status === 401) {
        throw new Error('Unauthorized');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}