// client/src/components/YearlySummary.jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function YearlySummary({ year }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (year) {
            loadSummary();
        }
    }, [year]);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/api/stats?year=${year}`);
            const categoryData = data.expenseByCategory || {};
            let maxCategory = null;
            let maxAmount = 0;
            for (const [cat, amount] of Object.entries(categoryData)) {
                if (amount > maxAmount) {
                    maxAmount = amount;
                    maxCategory = cat;
                }
            }
            const totalIncome = data.totalIncome;
            const totalExpense = data.totalExpense;
            const balance = totalIncome - totalExpense;
            const monthlyAvgExpense = totalExpense / 12;
            setSummary({
                totalIncome,
                totalExpense,
                balance,
                maxCategory,
                maxAmount,
                monthlyAvgExpense
            });
        } catch (err) {
            console.error('加载年度总结失败', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="card">加载年度总结...</div>;
    if (!summary) return null;

    return (
        <div className="card">
            <h4>📅 {year} 年度总结</h4>
            <div className="stats-grid">
                <div className="stat-card">💰 总收入: <strong>{summary.totalIncome.toFixed(2)}</strong></div>
                <div className="stat-card">💸 总支出: <strong>{summary.totalExpense.toFixed(2)}</strong></div>
                <div className="stat-card">📈 结余: <strong>{summary.balance.toFixed(2)}</strong></div>
                <div className="stat-card">📊 月均支出: <strong>{summary.monthlyAvgExpense.toFixed(2)}</strong></div>
                <div className="stat-card">🏆 最大支出类别: <strong>{summary.maxCategory || '无'} ({summary.maxAmount.toFixed(2)})</strong></div>
            </div>
        </div>
    );
}