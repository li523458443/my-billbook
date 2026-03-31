import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function BudgetModal({ isOpen, onClose, onSave, month, categories }) {
    const [budgets, setBudgets] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && month) {
            loadBudgets();
        }
    }, [isOpen, month]);

    const loadBudgets = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/api/budgets?month=${month}`);
            const budgetMap = {};
            data.forEach(b => { budgetMap[b.category] = b.amount; });
            setBudgets(budgetMap);
        } catch (err) {
            console.error('加载预算失败', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (category, value) => {
        setBudgets(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            for (const [category, amount] of Object.entries(budgets)) {
                if (amount > 0) {
                    await apiFetch('/api/budgets', {
                        method: 'POST',
                        body: JSON.stringify({ category, month, amount })
                    });
                }
            }
            alert('预算保存成功');
            onSave();
            onClose();
        } catch (err) {
            alert('保存失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>设置预算 - {month}</h3>
                <form onSubmit={handleSubmit}>
                    {categories.map(cat => (
                        <div key={cat} style={{ marginBottom: '10px' }}>
                            <label>{cat}</label>
                            <input
                                type="number"
                                step="0.01"
                                value={budgets[cat] || ''}
                                onChange={(e) => handleChange(cat, e.target.value)}
                                placeholder="输入预算金额"
                            />
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} disabled={loading}>取消</button>
                        <button type="submit" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}