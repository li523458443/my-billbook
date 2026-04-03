import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import Login from './components/Login';
import TransactionList from './components/TransactionList';
import ImportPreview from './components/ImportPreview';
import QuickAddModal from './components/QuickAddModal';
import Stats from './components/Stats';
import YearlySummary from './components/YearlySummary';
import MonthlyTrend from './components/MonthlyTrend';
import BudgetModal from './components/BudgetModal';
import BudgetOverview from './components/BudgetOverview';
import { apiFetch } from './services/api';

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
    minAmount: '',
    maxAmount: '',
    noteKeyword: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const currentYear = new Date().getFullYear();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  // 生成当前选择的月份字符串
  useEffect(() => {
    if (filters.year && filters.month) {
      setSelectedMonth(`${filters.year}-${filters.month}`);
    } else if (filters.year) {
      setSelectedMonth(`${filters.year}-01`);
    } else {
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
  }, [filters]);

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
    setFilters({
      year: '',
      month: '',
      category: '',
      counterparty: '',
      minAmount: '',
      maxAmount: '',
      noteKeyword: '',
    });
    setCurrentPage(1);
  };

  const handleCategoryClick = (category) => {
    setFilters(prev => ({ ...prev, category }));
    setCurrentPage(1);
  };

  if (!isAuthenticated) {
    return <Login onLogin={login} onRegister={register} error={authError} loading={authLoading} /> ;
  }

  return (
    <div className="app">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📊 个人记账本</h1>
        <div>
          <button onClick={() => setShowQuickAdd(true)} className="btn btn-primary" style={{ marginRight: '10px' }}>
            ➕ 快速记账
          </button>
          <button onClick={() => setShowBudgetModal(true)} className="btn">💰 预算</button>
          <button onClick={logout} className="btn">退出</button>
        </div>
      </header>

      <main>
        {/* 筛选栏 */}
        <div className="filter-bar">
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
          <div className="filter-group">
            <label>金额范围</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="number"
                placeholder="最小"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                style={{ width: '80px' }}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="最大"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                style={{ width: '80px' }}
              />
            </div>
          </div>
          <div className="filter-group">
            <label>备注关键词</label>
            <input
              type="text"
              placeholder="搜索备注"
              value={filters.noteKeyword}
              onChange={(e) => handleFilterChange('noteKeyword', e.target.value)}
            />
          </div>
          <button onClick={applyFilters} className="btn btn-primary">筛选</button>
          <button onClick={resetFilters} className="btn">重置</button>
        </div>

        <YearlySummary year={filters.year || currentYear} />
        <MonthlyTrend year={filters.year || currentYear} />
        <Stats filters={filters} onCategoryClick={handleCategoryClick} />
        <BudgetOverview month={selectedMonth} />
        <ImportPreview onImportSuccess={() => fetchTransactions(filters, currentPage)} />

        <TransactionList
          transactions={transactions}
          loading={txLoading}
          pagination={pagination}
          onPageChange={setCurrentPage}
          onDelete={deleteTransaction}
          onUpdateCategory={updateCategory}
          categories={categories}
        />

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</button>
            <span>第 {currentPage} / {pagination.totalPages} 页</span>
            <button className="page-btn" disabled={currentPage >= pagination.totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一页</button>
          </div>
        )}
      </main>

      <BudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSave={() => {}}
        month={selectedMonth}
        categories={categories}
      />

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