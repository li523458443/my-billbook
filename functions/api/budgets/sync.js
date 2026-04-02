export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    const { month, budgets } = await request.json();
    if (!month || !Array.isArray(budgets)) {
        return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400 });
    }

    // 开始事务
    const stmt = env.DB.prepare('BEGIN TRANSACTION');
    await stmt.run();

    try {
        // 1. 删除该月份下不在 budgets 中的记录
        const existing = await env.DB.prepare('SELECT category FROM budgets WHERE month = ?').bind(month).all();
        const existingCategories = existing.results.map(r => r.category);
        const newCategories = budgets.map(b => b.category).filter(c => c && c.trim());
        const toDelete = existingCategories.filter(c => !newCategories.includes(c));
        for (const cat of toDelete) {
            await env.DB.prepare('DELETE FROM budgets WHERE month = ? AND category = ?').bind(month, cat).run();
        }

        // 2. 插入或更新新的预算
        for (const { category, amount } of budgets) {
            if (category && amount > 0) {
                await env.DB.prepare(
                    `INSERT INTO budgets (category, month, amount, updated_at) 
                     VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
                     ON CONFLICT(category, month) DO UPDATE SET amount = excluded.amount, updated_at = CURRENT_TIMESTAMP`
                ).bind(category, month, amount).run();
            }
        }

        await env.DB.prepare('COMMIT').run();
        return new Response(JSON.stringify({ success: true }));
    } catch (err) {
        await env.DB.prepare('ROLLBACK').run();
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}