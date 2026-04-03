const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
};

// ====================== 原有接口保持不动 ======================
export const login = (data) => fetch('/api/login', { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
export const register = (data) => fetch('/api/register', { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json());
export const getTransactions = () => fetch('/api/transactions', { headers }).then(r => r.json());
export const getCategories = () => fetch('/api/categories', { headers }).then(r => r.json());

// ====================== 新增 3 个接口（直接加进去） ======================
export const getBudgets = (month) => fetch(`/api/budgets?month=${month}`, { headers }).then(r => r.json());
export const getBudgetUsage = (month) => fetch(`/api/budgets/usage?month=${month}`, { headers }).then(r => r.json());
export const syncBudgets = (month, budgets) => fetch('/api/budgets/sync', {
  method: 'POST',
  headers,
  body: JSON.stringify({ month, budgets })
}).then(r => r.json());

export const getMonthlySummary = (year, month) => fetch(`/api/stats/summary?year=${year}&month=${month}`, { headers }).then(r => r.json());