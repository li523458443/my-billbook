const getAuthHeader = () => {
  const password = localStorage.getItem('bill_auth');
  return password ? { 'X-Auth-Password': password } : {};
};

export async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };
  const res = await fetch(endpoint, { ...options, headers });
  if (res.status === 401) {
    // 未授权，清除登录状态
    localStorage.removeItem('bill_auth');
    window.location.reload(); // 强制刷新回到登录页
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}