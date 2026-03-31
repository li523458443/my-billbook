import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function QuickAddModal({ isOpen, onClose, onSuccess, categories }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0,10),
    type: 'expense',
    amount: '',
    counterparty: '',
    category: categories[0] || '餐饮',
    note: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCounterpartyBlur = async () => {
    const counterparty = formData.counterparty.trim();
    if (!counterparty) return;
    try {
      const res = await apiFetch(`/api/learning/recommend?counterparty=${encodeURIComponent(counterparty)}`);
      if (res.category && categories.includes(res.category)) {
        setFormData(prev => ({ ...prev, category: res.category }));
        // 可选：显示提示
      }
    } catch (err) {
      console.warn('推荐失败', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          source: 'manual'
        })
      });
      alert('记账成功');
      onSuccess();
      onClose();
    } catch (err) {
      alert('记账失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>快速记账</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>类型</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div>
            <label>金额</label>
            <input type="number" name="amount" step="0.01" value={formData.amount} onChange={handleChange} required />
          </div>
          <div>
            <label>对方名称</label>
            <input
              type="text"
              name="counterparty"
              value={formData.counterparty}
              onChange={handleChange}
              onBlur={handleCounterpartyBlur}
              required
            />
          </div>
          <div>
            <label>日期</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div>
            <label>分类</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label>备注</label>
            <input type="text" name="note" value={formData.note} onChange={handleChange} />
          </div>
          <div className="flex-row">
            <button type="button" onClick={onClose} disabled={loading}>取消</button>
            <button type="submit" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}