import { useState, useEffect } from 'react';
import { getBudgets, syncBudgets, getBudgetUsage } from '../services/api';

export default function BudgetOverview() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [categories, setCategories] = useState([]);
  const [budgetList, setBudgetList] = useState([{ category: '', amount: 0 }]);
  const [usageList, setUsageList] = useState([]);
  const token = localStorage.getItem('token');

  // 加载分类
  const loadCategories = async () => {
    const res = await fetch('/api/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setCategories(data || []);
  };

  // 加载预算
  const loadBudget = async () => {
    const data = await getBudgets(month);
    if (data.length === 0) {
      setBudgetList([{ category: '', amount: 0 }]);
    } else {
      setBudgetList(data);
    }
    loadUsage();
  };

  // 加载预算使用情况（进度条）
  const loadUsage = async () => {
    const res = await getBudgetUsage(month);
    if (res.success) setUsageList(res.data);
  };

  const addItem = () => {
    setBudgetList([...budgetList, { category: '', amount: 0 }]);
  };

  const delItem = (index) => {
    setBudgetList(budgetList.filter((_, i) => i !== index));
  };

  // 保存预算（支持自定义分类）
  const handleSave = async () => {
    const valid = budgetList.filter(b => b.category && b.amount > 0);
    const res = await syncBudgets(month, valid);
    if (res.success) {
      alert('保存成功');
      loadBudget();
    } else {
      alert(res.error || '保存失败');
    }
  };

  useEffect(() => {
    loadCategories();
    loadBudget();
  }, [month]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>月度预算</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ padding: '8px', flex: 1 }}
        />
        <button onClick={loadBudget} style={{ padding: '8px 14px' }}>加载</button>
      </div>

      {/* 预算编辑 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {budgetList.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px' }}>
            {/* 分类：可选择 + 可自定义输入 */}
            <input
              list="categoryOptions"
              value={item.category}
              onChange={(e) => {
                const newList = [...budgetList];
                newList[index].category = e.target.value;
                setBudgetList(newList);
              }}
              placeholder="选择或输入分类"
              style={{ flex: 1, padding: '8px' }}
            />

            <input
              type="number"
              value={item.amount}
              onChange={(e) => {
                const newList = [...budgetList];
                newList[index].amount = Number(e.target.value);
                setBudgetList(newList);
              }}
              placeholder="金额"
              style={{ width: '100px', padding: '8px' }}
            />

            <button
              onClick={() => delItem(index)}
              style={{ padding: '8px 12px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <datalist id="categoryOptions">
        {categories.map((c, i) => (
          <option key={i} value={c} />
        ))}
      </datalist>

      <button
        onClick={addItem}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          marginTop: '10px'
        }}
      >
        + 添加分类
      </button>

      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          marginTop: '16px',
          fontSize: '16px'
        }}
      >
        保存预算
      </button>

      {/* 预算使用进度条 */}
      {usageList.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>预算使用情况</h3>
          {usageList.map((u, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{u.category}</span>
                <span>{u.used} / {u.budget} ({u.percent}%)</span>
              </div>
              <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: u.percent + '%',
                    backgroundColor:
                      u.status === 'over' ? '#ef4444'
                        : u.status === 'warn' ? '#f59e0b'
                          : '#22c55e'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}