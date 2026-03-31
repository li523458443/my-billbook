import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import Login from './components/Login';
import TransactionList from './components/TransactionList';
import ImportPreview from './components/ImportPreview';
import QuickAddModal from './components/QuickAddModal';
import Stats from './components/Stats';
import { apiFetch } from './services/api';
import MonthlyTrend from './components/MonthlyTrend';

function App() {
  const { isAuthenticated, loading: authLoading, error: authError, login, logout } = useAuth();
  const {
    transactions,
    pagination,
    loading: txLoading,
    fetchTransactions,
    deleteTransaction,
    updateCategory,
  } = useTransactions();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [filters, setFilters] = useState({
    year: '',
    month: '',
    category: '',
    counterparty: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const currentYear = new Date().getFullYear();

  // 加载分类列表
  useEffect(() => {
    apiFetch('/api/categories')
      .then(data => setCategories(data))
      .catch(err => console.error('加载分类失败', err));
  }, []);

  // 登录后加载数据
  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions(filters, currentPage);
    }
  }, [isAuthenticated, filters, currentPage, fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchTransactions(filters, 1);
  };

  const resetFilters = () => {
    setFilters({ year: '', month: '', category: '', counterparty: '' });
    setCurrentPage(1);
  };

  if (!isAuthenticated) {
    return <Login onLogin={login} error={authError} loading={authLoading} />;
  }

  return (
    <div className="app">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📊 个人记账本</h1>
        <div>
          <button onClick={() => setShowQuickAdd(true)} className="btn btn-primary" style={{ marginRight: '10px' }}>
            ➕ 快速记账
          </button>
          <button onClick={logout} className="btn">退出</button>
        </div>
      </header>

      <main>
        {/* 筛选栏 */}
        <div className="filter-bar" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div className="filter-group">
            <label>年份</label>
            <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
              <option value="">全部</option>
              {[...Array(6)].map((_, i) => {
                const year = currentYear - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <div className="filter-group">
            <label>月份</label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              disabled={!filters.year}
            >
              <option value="">全部</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={String(m).padStart(2, '0')}>{m}月</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>分类</label>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
              <option value="">全部分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>对方名称</label>
            <input
              type="text"
              value={filters.counterparty}
              onChange={(e) => handleFilterChange('counterparty', e.target.value)}
              placeholder="输入对方名称"
            />
          </div>
          <button onClick={applyFilters} className="btn btn-primary">筛选</button>
          <button onClick={resetFilters} className="btn">重置</button>
        </div>

        {/* 月度趋势 */}
        <MonthlyTrend year={filters.year || currentYear} />

        {/* 统计图表 */}
        <Stats filters={filters} />

        {/* 导入预览 */}
        <ImportPreview onImportSuccess={() => fetchTransactions(filters, currentPage)} />

        {/* 交易列表 */}
        <TransactionList
          transactions={transactions}
          loading={txLoading}
          pagination={pagination}
          onPageChange={(page) => setCurrentPage(page)}
          onDelete={deleteTransaction}
          onUpdateCategory={updateCategory}
          categories={categories}
        />

        {/* 分页控件 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              上一页
            </button>
            <span>第 {currentPage} / {pagination.totalPages} 页</span>
            <button
              className="page-btn"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </main>

      {/* 快速记账弹窗 */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSuccess={() => {
          fetchTransactions(filters, currentPage);
          setShowQuickAdd(false);
        }}
        categories={categories}
      />
    </div>
  );
}

export default App;