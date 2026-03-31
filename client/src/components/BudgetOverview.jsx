import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function BudgetOverview({ month }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (month) {
            loadUsage();
        }
    }, [month]);

    const loadUsage = async () => {
        setLoading(true);
        try {
            const result = await apiFetch(`/api/budgets/usage?month=${month}`);
            setData(result);
        } catch (err) {
            console.error('加载预算使用情况失败', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>加载预算数据...</div>;
    if (data.length === 0) return <div>暂无预算数据，请先设置预算</div>;

    return (
        <div className="card">
            <h4>💰 预算执行情况 ({month})</h4>
            {data.map(item => (
                <div key={item.category} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.category}</span>
                        <span>¥{item.spent.toFixed(2)} / ¥{item.budget.toFixed(2)}</span>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(item.percent, 100)}%`,
                            background: item.percent > 100 ? '#ef4444' : '#10b981',
                            height: '8px',
                            transition: 'width 0.3s'
                        }}></div>
                    </div>
                    {item.percent > 100 && (
                        <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                            超支 ¥{(item.spent - item.budget).toFixed(2)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}