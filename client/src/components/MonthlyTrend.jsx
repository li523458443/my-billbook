import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { apiFetch } from '../services/api';

export default function MonthlyTrend({ year }) {
    const [data, setData] = useState({ monthlyData: [], year: year || new Date().getFullYear() });
    const [loading, setLoading] = useState(false);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        loadMonthlyData();
    }, [year]);

    const loadMonthlyData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (year) params.append('year', year);
            params.append('type', 'monthly');
            const url = `/api/stats?${params.toString()}`;
            const result = await apiFetch(url);
            setData(result);
        } catch (err) {
            console.error('加载月度数据失败', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!chartRef.current || data.monthlyData.length === 0) return;
        const ctx = chartRef.current.getContext('2d');
        if (chartInstance.current) chartInstance.current.destroy();

        const months = data.monthlyData.map(d => `${d.month}月`);
        const incomes = data.monthlyData.map(d => d.income);
        const expenses = data.monthlyData.map(d => d.expense);

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: '收入',
                        data: incomes,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: true,
                    },
                    {
                        label: '支出',
                        data: expenses,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.3,
                        fill: true,
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                let value = context.raw;
                                return `${label}: ${value.toFixed(2)}元`;
                            }
                        }
                    }
                }
            }
        });
    }, [data]);

    if (loading) return <div>加载月度趋势...</div>;
    if (!data.monthlyData || data.monthlyData.length === 0) return <div>暂无月度数据</div>;

    return (
        <div className="card">
            <h4>📈 月度收支趋势 ({data.year}年)</h4>
            <canvas ref={chartRef} width="400" height="200"></canvas>
        </div>
    );
}