import { useState, useEffect } from 'react';
import { getMonthlySummary } from '../services/api';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const loadData = async () => {
    const res = await getMonthlySummary(year, month);
    if (res.success) setSummary(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{
        flex: 1,
        background: '#fff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>本月收入</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a', marginTop: '8px' }}>
          ¥{summary.income.toFixed(2)}
        </div>
      </div>

      <div style={{
        flex: 1,
        background: '#fff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>本月支出</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444', marginTop: '8px' }}>
          ¥{summary.expense.toFixed(2)}
        </div>
      </div>

      <div style={{
        flex: 1,
        background: '#fff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>本月结余</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6', marginTop: '8px' }}>
          ¥{summary.balance.toFixed(2)}
        </div>
      </div>
    </div>
  );
}