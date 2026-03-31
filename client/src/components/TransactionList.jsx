export default function TransactionList({
  transactions = [],          // 默认空数组，防止 undefined
  loading,
  pagination,
  onPageChange,
  onDelete,
  onUpdateCategory,
  categories = []            // 默认空数组
}) {
  if (loading) return <div>加载中...</div>;
  if (!transactions || transactions.length === 0) return <div>暂无交易记录</div>;

  return (
    <>
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
              <td>{t.date}</td>
              <td>{t.type === 'expense' ? '支出' : '收入'}</td>
              <td style={{ color: t.type === 'expense' ? '#ef4444' : '#10b981' }}>
                {Math.abs(t.amount).toFixed(2)}
              </td>
              <td>{t.counterparty || '-'}</td>
              <td>
                <select
                  value={t.category}
                  onChange={(e) => onUpdateCategory(t.id, e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </td>
              <td>
                {t.source === 'wechat' ? '微信' : t.source === 'alipay' ? '支付宝' : '云闪付'}
              </td>
              <td>
                <button onClick={() => onDelete(t.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
// 在表格下方添加分页控件
	{pagination && pagination.totalPages > 1 && (
	  <div className="pagination-controls">
		<div className="pagination-buttons">
		  <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
			上一页
		  </button>
		  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
			let page = pagination.page;
			if (pagination.totalPages <= 5) {
			  page = i + 1;
			} else if (pagination.page <= 3) {
			  page = i + 1;
			} else if (pagination.page >= pagination.totalPages - 2) {
			  page = pagination.totalPages - 4 + i;
			} else {
			  page = pagination.page - 2 + i;
			}
			return (
			  <button
				key={page}
				className={page === pagination.page ? 'active' : ''}
				onClick={() => onPageChange(page)}
			  >
				{page}
			  </button>
			);
		  })}
		  <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
			下一页
		  </button>
		</div>
		<div className="pagination-info">
		  第 {pagination.page} / {pagination.totalPages} 页
		</div>
		<div className="pagination-limit">
		  每页
		  <select value={pagination.limit} onChange={(e) => onLimitChange(Number(e.target.value))}>
			<option value={10}>10</option>
			<option value={20}>20</option>
			<option value={50}>50</option>
			<option value={100}>100</option>
		  </select>
		  条
		</div>
	  </div>
	)}
    </>
  );
}