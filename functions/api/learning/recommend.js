export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const counterparty = url.searchParams.get('counterparty');
    if (!counterparty) {
        return new Response(JSON.stringify({ error: '缺少对方名称' }), { status: 400 });
    }
    // 查询该对方出现次数最多的分类
    const rule = await env.DB.prepare(
        `SELECT category FROM learning_rules WHERE counterparty = ? ORDER BY count DESC LIMIT 1`
    ).bind(counterparty).first();
    return new Response(JSON.stringify({ category: rule ? rule.category : null }));
}