// functions/api/transactions.js
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 处理 POST 请求（手动记账）
    if (request.method === 'POST') {
        const { date, type, amount, counterparty, note, category, source, transactionId } = await request.json();
        if (!date || !type || !amount) {
            return new Response(JSON.stringify({ error: '缺少必要字段' }), { status: 400 });
        }
        const result = await env.DB.prepare(
            'INSERT INTO transactions (date, type, amount, counterparty, note, category, source, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(date, type, amount, counterparty || '', note || '', category || '其他', source || 'manual', transactionId || '').run();
        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }));
    }

    // GET 请求（列表）
    const counterparty = url.searchParams.get('counterparty');
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');
    const minAmount = url.searchParams.get('minAmount');
    const maxAmount = url.searchParams.get('maxAmount');
    const noteKeyword = url.searchParams.get('noteKeyword');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    let whereClauses = [];
    let params = [];

    if (counterparty) {
        whereClauses.push('counterparty LIKE ?');
        params.push(`%${counterparty}%`);
    }
    if (year) {
        whereClauses.push('strftime("%Y", date) = ?');
        params.push(year);
        if (month) {
            whereClauses.push('strftime("%m", date) = ?');
            params.push(month.padStart(2, '0'));
        }
    }
    if (category) {
        whereClauses.push('category = ?');
        params.push(category);
    }
    if (minAmount) {
        whereClauses.push('amount >= ?');
        params.push(parseFloat(minAmount));
    }
    if (maxAmount) {
        whereClauses.push('amount <= ?');
        params.push(parseFloat(maxAmount));
    }
    if (noteKeyword) {
        whereClauses.push('note LIKE ?');
        params.push(`%${noteKeyword}%`);
    }

    const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const offset = (page - 1) * limit;

    const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM transactions ${where}`).bind(...params).first();
    const sql = `SELECT id, date, type, amount, counterparty, note, category, source, transaction_id 
                 FROM transactions ${where} ORDER BY date DESC LIMIT ? OFFSET ?`;
    const { results } = await env.DB.prepare(sql).bind(...params, limit, offset).all();

    return new Response(JSON.stringify({
        data: results,
        pagination: {
            page,
            limit,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit)
        }
    }));
}