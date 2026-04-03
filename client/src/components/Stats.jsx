import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { apiFetch } from '../services/api';

export default function Stats({ filters, onCategoryClick }) {
    const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, expenseByCategory: {} });
    const [loading, setLoading] = useState(false);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        loadStats();
    }, [filters]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.year) params.append('year', filters.year);
            if (filters.month) params.append('month', filters.month);
            if (filters.category) params.append('category', filters.category);
            const url = `/api/stats${params.toString() ? '?' + params.toString() : ''}`;
            const data = await apiFetch(url);
            setStats(data);
        } catch (err) {
            console.error('加载统计数据失败', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        const labels = Object.keys(stats.expenseByCategory);
        const values = Object.values(stats.expenseByCategory);

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        if (labels.length > 0) {
            chartInstance.current = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: ['#3b82f6','#f97316','#10b981','#f59e0b','#8b5cf6','#ec489a','#64748b','#f43f5e','#06b6d4','#a855f7']
                    }]
                },
                options: {
                    responsive: true,
                    onClick: (event, activeElements) => {
                        if (activeElements.length === 0) return;
                        const index = activeElements[0].index;
                        const clickedCategory = labels[index];
                        if (onCategoryClick) {
                            onCategoryClick(clickedCategory);
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value.toFixed(2)}元 (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }, [stats.expenseByCategory, onCategoryClick]);

    const balance = stats.totalIncome - stats.totalExpense;

    if (loading) return <div>加载统计数据...</div>;

    return (
        <div className="card">
            <div className="stats-grid">
                <div className="stat-card">💰 总收入: <strong>{stats.totalIncome.toFixed(2)}</strong></div>
                <div className="stat-card">💸 总支出: <strong>{stats.totalExpense.toFixed(2)}</strong></div>
                <div className="stat-card">📈 结余: <strong>{balance.toFixed(2)}</strong></div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <canvas ref={chartRef} width="400" height="300"></canvas>
                </div>
                <div style={{ flex: 2, minWidth: '200px' }}>
                    <h4>📌 支出类别占比</h4>
                    <div id="categoryLegend">
                        {Object.entries(stats.expenseByCategory).map(([cat, amount], idx) => {
                            const total = Object.values(stats.expenseByCategory).reduce((a,b)=>a+b,0);
                            const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                            const colors = ['#3b82f6','#f97316','#10b981','#f59e0b','#8b5cf6','#ec489a','#64748b','#f43f5e','#06b6d4','#a855f7'];
                            return (
                                <div key={cat} style={{ margin: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>
                                        <span style={{ display: 'inline-block', width: '12px', height: '12px', background: colors[idx % colors.length], borderRadius: '50%', marginRight: '8px' }}></span>
                                        {cat}
                                    </span>
                                    <strong>{amount.toFixed(2)}元 ({percentage}%)</strong>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}