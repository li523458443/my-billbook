// 真实模式（部署时使用），不再模拟
const USE_MOCK = false;

export async function apiFetch(endpoint, options = {}) {
  // 真实模式
  const authPassword = localStorage.getItem('bill_auth');
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
