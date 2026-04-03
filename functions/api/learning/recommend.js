export async function onRequest(context) {
    const { request, env } = context;
    const userId = context.userId;
    const url = new URL(request.url);
    const counterparty = url.searchParams.get('counterparty');
    if (!counterparty) {
        return new Response(JSON.stringify({ error: '缺少对方名称' }), { status: 400 });
    }
    const rule = await env.DB.prepare(
        `SELECT category FROM learning_rules WHERE user_id = ? AND counterparty = ? ORDER BY count DESC LIMIT 1`
    ).bind(userId, counterparty).first();
    return new Response(JSON.stringify({ category: rule ? rule.category : null }));
}