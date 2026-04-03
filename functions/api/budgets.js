export async function onRequest(context) {
    const { request, env } = context;
    const userId = context.userId;
    const url = new URL(request.url);
    const month = url.searchParams.get('month');

    if (request.method === 'GET') {
        let query = 'SELECT id, category, month, amount FROM budgets WHERE user_id = ?';
        const params = [userId];
        if (month) {
            query += ' AND month = ?';
            params.push(month);
        }
        query += ' ORDER BY category';
        const { results } = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
        const { category, month, amount } = await request.json();
        if (!category || !month || amount === undefined) {
            return new Response(JSON.stringify({ error: '缺少必要参数' }), { status: 400 });
        }
        await env.DB.prepare(
            `INSERT INTO budgets (category, month, amount, user_id, updated_at) 
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) 
             ON CONFLICT(category, month, user_id) DO UPDATE SET amount = excluded.amount, updated_at = CURRENT_TIMESTAMP`
        ).bind(category, month, amount, userId).run();
        return new Response(JSON.stringify({ success: true }));
    }

    if (request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return new Response(JSON.stringify({ error: '缺少 id' }), { status: 400 });
        await env.DB.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').bind(id, userId).run();
        return new Response(JSON.stringify({ success: true }));
    }

    return new Response('Method not allowed', { status: 405 });
}