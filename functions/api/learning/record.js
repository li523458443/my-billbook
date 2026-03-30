export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    const { counterparty, category } = await request.json();
    if (!counterparty || !category) {
        return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400 });
    }
    // 存储学习规则，可以设置权重（计数）以便后续统计
    // 表 learning_rules 设计：id, counterparty, category, count, created_at, updated_at
    // 使用 INSERT OR REPLACE 更新计数
    await env.DB.prepare(
        `INSERT INTO learning_rules (counterparty, category, count, updated_at) 
         VALUES (?, ?, 1, CURRENT_TIMESTAMP) 
         ON CONFLICT(counterparty, category) DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP`
    ).bind(counterparty, category).run();
    return new Response(JSON.stringify({ success: true }));
}