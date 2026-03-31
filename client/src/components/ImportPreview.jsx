import { useState } from 'react';
import { apiFetch } from '../services/api';
import { parseFile } from '../utils/parsers';

export default function ImportPreview({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [billType, setBillType] = useState('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null); // { newItems, duplicates }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setPreviewData(null);
  };

  const handleParse = async () => {
    if (!file) {
      setError('请选择文件');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const records = await parseFile(file, billType);
      if (records.length === 0) {
        setError('未解析到任何交易记录，请检查文件格式');
        return;
      }

      // 调用后端检查接口（模拟模式返回传入的交易作为新记录）
      const checkResult = await apiFetch('/api/import/check', {
        method: 'POST',
        body: JSON.stringify({ transactions: records }),
      });

      setPreviewData(checkResult);
    } catch (err) {
      setError(err.message || '解析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    const { newItems, duplicates } = previewData;

    // 收集新记录（直接使用，分类可能已被修改）
    const finalNewItems = newItems.map(item => ({ ...item }));

    // 收集选中的重复记录
    const checkboxes = document.querySelectorAll('.dup-checkbox');
    const selectedOverwrites = [];
    checkboxes.forEach(cb => {
      if (cb.checked) {
        const idx = parseInt(cb.dataset.index, 10);
        const dup = duplicates[idx];
        // 获取该行中分类选择框的最新值
        const row = cb.closest('tr');
        const select = row.querySelector('.dup-category-select');
        if (select) {
          dup.category = select.value;
        }
        selectedOverwrites.push(dup);
      }
    });

    if (finalNewItems.length === 0 && selectedOverwrites.length === 0) {
      setError('没有可导入的记录');
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch('/api/import/confirm', {
        method: 'POST',
        body: JSON.stringify({
          newItems: finalNewItems,
          overwrites: selectedOverwrites,
        }),
      });
      alert(result.message);
      // 通知父组件刷新数据
      if (onImportSuccess) onImportSuccess();
      // 清空预览
      setPreviewData(null);
      setFile(null);
      // 清空文件 input
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  // 全选/取消全选
  const handleSelectAll = (e) => {
    const checkboxes = document.querySelectorAll('.dup-checkbox');
    checkboxes.forEach(cb => (cb.checked = e.target.checked));
  };

  // 渲染预览界面
  const renderPreview = () => {
    if (!previewData) return null;
    const { newItems, duplicates } = previewData;

    return (
      <div style={{ marginTop: '20px' }}>
        {/* 新记录表格 */}
        <h4>📋 新交易记录</h4>
        <table className="transaction-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>类型</th>
              <th>金额(元)</th>
              <th>对方/备注</th>
              <th>分类</th>
              <th>来源</th>
            </tr>
          </thead>
          <tbody>
            {newItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.date}</td>
                <td>{item.type === 'expense' ? '支出' : '收入'}</td>
                <td>{item.amount.toFixed(2)}</td>
                <td>{item.counterparty || ''}{item.note ? ` (${item.note})` : ''}</td>
                <td>
                  <select
                    value={item.category}
                    onChange={(e) => (item.category = e.target.value)}
                  >
                    {['餐饮','交通','购物','娱乐','人情往来','医疗','住房','利息','退款','其他'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {item.source === 'wechat' ? '微信' : item.source === 'alipay' ? '支付宝' : '云闪付'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 重复记录表格（如果有） */}
        {duplicates.length > 0 && (
          <>
            <h4>⚠️ 重复记录 (勾选需要覆盖的条目)</h4>
            <table className="transaction-table">
              <thead>
                <tr>
                  <th><input type="checkbox" id="selectAll" onChange={handleSelectAll} /></th>
                  <th>日期</th>
                  <th>类型</th>
                  <th>金额(元)</th>
                  <th>对方/备注</th>
                  <th>分类</th>
                  <th>来源</th>
                  <th>已有记录信息</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.map((item, idx) => (
                  <tr key={idx}>
                    <td><input type="checkbox" className="dup-checkbox" data-index={idx} /></td>
                    <td>{item.date}</td>
                    <td>{item.type === 'expense' ? '支出' : '收入'}</td>
                    <td>{item.amount.toFixed(2)}</td>
                    <td>{item.counterparty || ''}{item.note ? ` (${item.note})` : ''}</td>
                    <td>
                      <select
                        className="dup-category-select"
                        value={item.category}
                        onChange={(e) => (item.category = e.target.value)}
                      >
                        {['餐饮','交通','购物','娱乐','人情往来','医疗','住房','利息','退款','其他'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {item.source === 'wechat' ? '微信' : item.source === 'alipay' ? '支付宝' : '云闪付'}
                    </td>
                    <td>
                      ID:{item.existingId} 日期:{item.existingDate} 金额:{item.existingAmount} 对方:{item.existingCounterparty} 分类:{item.existingCategory}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={handleConfirm} className="btn btn-primary" disabled={loading}>
            {loading ? '导入中...' : '✅ 确认导入以上记录'}
          </button>
          <button onClick={() => setPreviewData(null)} className="btn">取消</button>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">📁 导入账单 (支持微信/支付宝/云闪付 XLSX/CSV)</div>
      <div className="flex-row">
        <select value={billType} onChange={(e) => setBillType(e.target.value)}>
          <option value="wechat">微信支付账单</option>
          <option value="alipay">支付宝账单</option>
          <option value="unionpay">云闪付账单</option>
        </select>
        <label className="file-label">
          📂 选择文件
          <input
            type="file"
            id="fileInput"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        <button onClick={handleParse} className="btn btn-primary" disabled={loading}>
          {loading ? '解析中...' : '解析并预览'}
        </button>
        {loading && <div className="loading" style={{ marginLeft: '10px' }}></div>}
      </div>
      {error && <div className="error" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      {renderPreview()}
    </div>
  );
}