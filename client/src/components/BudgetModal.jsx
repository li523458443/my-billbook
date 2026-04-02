import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function BudgetModal({ isOpen, onClose, onSave, initialMonth, categories }) {
    const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date().toISOString().slice(0, 7));
    const [budgetItems, setBudgetItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // 加载指定月份的预算
    useEffect(() => {
        if (isOpen && selectedMonth) {
            loadBudgets();
        }
    }, [isOpen, selectedMonth]);

    const loadBudgets = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/api/budgets?month=${selectedMonth}`);
            const items = data.map(b => ({
                id: b.id,
                category: b.category,
                amount: b.amount
            }));
            setBudgetItems(items);
            setHasChanges(false);
        } catch (err) {
            console.error('加载预算失败', err);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setBudgetItems([...budgetItems, { id: Date.now(), category: '', amount: '' }]);
        setHasChanges(true);
    };

    const removeItem = (id) => {
        setBudgetItems(budgetItems.filter(item => item.id !== id));
        setHasChanges(true);
    };

    const updateItem = (id, field, value) => {
        setBudgetItems(budgetItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
        setHasChanges(true);
    };

    const handleSave = async () => {
        const validItems = budgetItems
            .filter(item => item.category && item.amount > 0)
            .map(({ category, amount }) => ({ category, amount }));
        if (validItems.length === 0 && budgetItems.length > 0) {
            alert('请至少填写一个有效的预算');
            return;
        }
        setLoading(true);
        try {
            await apiFetch('/api/budgets/sync', {
                method: 'POST',
                body: JSON.stringify({ month: selectedMonth, budgets: validItems })
            });
            alert('预算保存成功');
            setHasChanges(false);
            if (onSave) onSave(selectedMonth);
            onClose();
        } catch (err) {
            alert('保存失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (hasChanges && !confirm('有未保存的更改，确定要关闭吗？')) {
            return;
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>预算管理</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label>月份</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {budgetItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <select
                                value={item.category}
                                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                style={{ flex: 2, padding: '8px' }}
                            >
                                <option value="">选择分类</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="预算金额"
                                value={item.amount}
                                onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || '')}
                                style={{ flex: 1, padding: '8px' }}
                            />
                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="btn btn-sm btn-danger"
                                style={{ padding: '4px 8px' }}
                            >
                                删除
                            </button>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                    <button type="button" onClick={addItem} className="btn">+ 添加预算</button>
                    <div>
                        <button type="button" onClick={handleClose} disabled={loading} style={{ marginRight: '10px' }}>取消</button>
                        <button type="button" onClick={handleSave} className="btn btn-primary" disabled={loading}>
                            {loading ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}