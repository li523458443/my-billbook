let authPassword = '';

export function setAuthPassword(password) {
  authPassword = password;
}

export async function apiFetch(endpoint, options = {}) {
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