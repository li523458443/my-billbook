// 是否使用模拟数据（本地开发时设为 true，部署时改为 false）
const USE_MOCK = true;

// 模拟数据：交易列表
const mockTransactions = [
  { id: 1, date: '2025-03-30', type: 'expense', amount: 45.00, counterparty: '星巴克', note: '咖啡', category: '餐饮', source: 'manual', transaction_id: '' },
  { id: 2, date: '2025-03-29', type: 'income', amount: 5000.00, counterparty: '公司', note: '工资', category: '其他', source: 'manual', transaction_id: '' },
  { id: 3, date: '2025-03-28', type: 'expense', amount: 28.00, counterparty: '地铁', note: '交通卡充值', category: '交通', source: 'manual', transaction_id: '' },
];
const mockPagination = { page: 1, limit: 50, total: mockTransactions.length, totalPages: 1 };
const mockStats = { totalIncome: 5000, totalExpense: 73, expenseByCategory: { '餐饮': 45, '交通': 28 } };
const mockCategories = ['餐饮', '交通', '购物', '娱乐', '人情往来', '医疗', '住房', '利息', '退款', '其他'];

/**
 * 通用 API 请求函数
 * @param {string} endpoint - 接口路径（如 '/api/transactions'）
 * @param {object} options - fetch 选项
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
  // 模拟模式：返回预设数据，延迟模拟网络
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300)); // 模拟网络延迟

    // 登录
    if (endpoint === '/api/login' && options.method === 'POST') {
      const { password } = JSON.parse(options.body);
      if (password === '123456') { // 替换为你本地测试的密码
        return { success: true };
      } else {
        throw new Error('密码错误');
      }
    }

    // 获取交易列表
    if (endpoint === '/api/transactions' && (!options.method || options.method === 'GET')) {
      return { data: mockTransactions, pagination: mockPagination };
    }

    // 获取统计数据
    if (endpoint.startsWith('/api/stats')) {
      return mockStats;
    }

    // 获取分类列表
    if (endpoint === '/api/categories') {
      return mockCategories;
    }

    // 智能推荐
    if (endpoint.startsWith('/api/learning/recommend')) {
      const url = new URL(endpoint, 'http://localhost');
      const counterparty = url.searchParams.get('counterparty') || '';
      // 简单规则：如果对方名称包含“餐”则推荐“餐饮”，否则返回 null
      const category = counterparty.includes('餐') ? '餐饮' : null;
      return { category };
    }

    // 记录学习（只模拟成功）
    if (endpoint === '/api/learning/record' && options.method === 'POST') {
      return { success: true };
    }

    // 导入检查：返回传入的交易作为新记录，重复记录为空
    if (endpoint === '/api/import/check' && options.method === 'POST') {
      const { transactions } = JSON.parse(options.body);
      return { newItems: transactions, duplicates: [] };
    }

    // 导入确认：模拟成功
    if (endpoint === '/api/import/confirm' && options.method === 'POST') {
      const { newItems, overwrites } = JSON.parse(options.body);
      const inserted = newItems ? newItems.length : 0;
      const updated = overwrites ? overwrites.length : 0;
      return { success: true, inserted, updated, message: `成功导入 ${inserted} 条新记录，覆盖 ${updated} 条重复记录。` };
    }

    // 其他未模拟的接口返回成功
    return { success: true };
  }

  // 真实模式（部署时使用）
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