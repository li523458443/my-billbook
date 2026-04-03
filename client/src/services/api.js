// 你项目原来就有的方法（必须保留，否则报错）
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);

export const apiFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers,
  });
  const data = await res.json();
  return data;
};

// ====================== 原有业务接口 ======================
export const login = (data) => apiFetch('/api/login', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const register = (data) => apiFetch('/api/register', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getTransactions = () => apiFetch('/api/transactions');
export const getCategories = () => apiFetch('/api/categories');

// ====================== 你新增的预算/统计接口 ======================
export const getBudgets = (month) => apiFetch(`/api/budgets?month=${month}`);
export const getBudgetUsage = (month) => apiFetch(`/api/budgets/usage?month=${month}`);
export const syncBudgets = (month, budgets) => apiFetch('/api/budgets/sync', {
  method: 'POST',
  body: JSON.stringify({ month, budgets }),
});

export const getMonthlySummary = (year, month) => 
  apiFetch(`/api/stats/summary?year=${year}&month=${month}`);