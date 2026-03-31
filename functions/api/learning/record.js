export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    const { counterparty, category } = await request.json();
    if (!counterparty || !category) {
        return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400 });
    }
    await env.DB.prepare(
        `INSERT INTO learning_rules (counterparty, category, count, updated_at) 
         VALUES (?, ?, 1, CURRENT_TIMESTAMP) 
         ON CONFLICT(counterparty, category) DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP`
    ).bind(counterparty, category).run();
    return new Response(JSON.stringify({ success: true }));
}