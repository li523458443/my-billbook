// client/src/components/TransactionList.jsx
export default function TransactionList({
    transactions = [],
    loading,
    pagination,
    onPageChange,
    onDelete,
    onUpdateCategory,
    categories = []
}) {
    if (loading) return <div className="loading-center">加载中...</div>;
    if (!transactions || transactions.length === 0) return <div className="empty-state">暂无交易记录</div>;

    return (
        <div className="table-container">
            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>类型</th>
                        <th>金额</th>
                        <th>对方</th>
                        <th>分类</th>
                        <th>来源</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t) => (
                        <tr key={t.id}>
                            <td data-label="日期">{t.date}</td>
                            <td data-label="类型">
                                {t.type === 'expense' ? '支出' : '收入'}
                            </td>
                            <td data-label="金额" style={{
                                color: t.type === 'expense' ? '#ef4444' : '#10b981',
                                fontWeight: 600
                            }}>
                                ¥{Math.abs(t.amount).toFixed(2)}
                            </td>
                            <td data-label="对方">{t.counterparty || '-'}</td>
                            <td data-label="分类">
                                <select
                                    value={t.category || ''}
                                    onChange={(e) => onUpdateCategory(t.id, e.target.value)}
                                    className="table-select"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </td>
                            <td data-label="来源">
                                {t.source === 'wechat' ? '微信' 
                                 : t.source === 'alipay' ? '支付宝' 
                                 : t.source === 'unionpay' ? '云闪付' 
                                 : '其他'}
                            </td>
                            <td data-label="操作">
                                <button 
                                    onClick={() => onDelete(t.id)}
                                    className="btn btn-sm btn-danger"
                                >
                                    删除
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={() => onPageChange(pagination.page - 1)} 
                        disabled={pagination.page <= 1}
                        className="page-btn"
                    >
                        上一页
                    </button>
                    <span>第 {pagination.page} / {pagination.totalPages} 页</span>
                    <button 
                        onClick={() => onPageChange(pagination.page + 1)} 
                        disabled={pagination.page >= pagination.totalPages}
                        className="page-btn"
                    >
                        下一页
                    </button>
                </div>
            )}
        </div>
    );
}