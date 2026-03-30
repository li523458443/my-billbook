export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const counterparty = url.searchParams.get('counterparty');
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 50;

    let where = '';
    const params = [];
    if (counterparty) {
        where += ' WHERE counterparty LIKE ?';
        params.push(`%${counterparty}%`);
    }
    if (year) {
        where += (where ? ' AND' : ' WHERE') + ' strftime("%Y", date) = ?';
        params.push(year);
        if (month) {
            where += ' AND strftime("%m", date) = ?';
            params.push(month.padStart(2, '0'));
        }
    }
    if (category) {
        where += (where ? ' AND' : ' WHERE') + ' category = ?';
        params.push(category);
    }

    const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM transactions ${where}`).bind(...params).first();
    const offset = (page - 1) * limit;
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