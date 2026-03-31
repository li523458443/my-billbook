export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    if (!month) {
        return new Response(JSON.stringify({ error: '缺少 month 参数' }), { status: 400 });
    }

    const budgets = await env.DB.prepare('SELECT category, amount FROM budgets WHERE month = ?').bind(month).all();
    if (budgets.results.length === 0) {
        return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
    }

    const year = month.split('-')[0];
    const monthNum = month.split('-')[1];
    const expenses = await env.DB.prepare(
        `SELECT category, COALESCE(SUM(amount), 0) as spent 
         FROM transactions 
         WHERE type = 'expense' AND strftime("%Y", date) = ? AND strftime("%m", date) = ? 
         GROUP BY category`
    ).bind(year, monthNum).all();

    const spentMap = {};
    for (const row of expenses.results) {
        spentMap[row.category] = row.spent;
    }

    const result = budgets.results.map(b => ({
        category: b.category,
        budget: b.amount,
        spent: spentMap[b.category] || 0,
        remaining: b.amount - (spentMap[b.category] || 0),
        percent: ((spentMap[b.category] || 0) / b.amount) * 100
    }));

    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}