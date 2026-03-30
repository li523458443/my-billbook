export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    let where = '';
    const params = [];
    if (year) {
        where = ' WHERE strftime("%Y", date) = ?';
        params.push(year);
        if (month) {
            where += ' AND strftime("%m", date) = ?';
            params.push(month.padStart(2, '0'));
        }
    }

    const { results } = await env.DB.prepare(`
        SELECT date, type, amount, counterparty, note, category, source, transaction_id
        FROM transactions ${where} ORDER BY date DESC
    `).bind(...params).all();

    if (format === 'csv') {
        const headers = ['日期', '类型', '金额', '对方', '备注', '分类', '来源', '交易单号'];
        const rows = results.map(r => [
            r.date,
            r.type === 'expense' ? '支出' : '收入',
            r.amount,
            r.counterparty,
            r.note,
            r.category,
            r.source,
            r.transaction_id
        ].map(f => `"${String(f).replace(/"/g, '""')}"`).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv;charset=utf-8',
                'Content-Disposition': `attachment; filename="bills_${year || 'all'}${month || ''}.csv"`
            }
        });
    }
    return new Response(JSON.stringify(results));
}