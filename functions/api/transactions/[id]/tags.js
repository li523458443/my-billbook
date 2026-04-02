export async function onRequest(context) {
    const { request, env, params } = context;
    const userId = context.userId;
    const transactionId = params.id;

    // 验证交易属于当前用户
    const transaction = await env.DB.prepare(
        'SELECT id FROM transactions WHERE id = ? AND user_id = ?'
    ).bind(transactionId, userId).first();
    if (!transaction) {
        return new Response(JSON.stringify({ error: '交易不存在或无权访问' }), { status: 404 });
    }

    // POST 添加标签
    if (request.method === 'POST') {
        const { tagId } = await request.json();
        if (!tagId) return new Response(JSON.stringify({ error: '缺少 tagId' }), { status: 400 });
        // 验证标签属于当前用户
        const tag = await env.DB.prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?').bind(tagId, userId).first();
        if (!tag) return new Response(JSON.stringify({ error: '标签不存在' }), { status: 404 });
        try {
            await env.DB.prepare(
                'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)'
            ).bind(transactionId, tagId).run();
            return new Response(JSON.stringify({ success: true }));
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return new Response(JSON.stringify({ error: '标签已关联' }), { status: 409 });
            }
            throw err;
        }
    }

    // DELETE 移除标签
    if (request.method === 'DELETE') {
        const { tagId } = await request.json();
        if (!tagId) return new Response(JSON.stringify({ error: '缺少 tagId' }), { status: 400 });
        await env.DB.prepare(
            'DELETE FROM transaction_tags WHERE transaction_id = ? AND tag_id = ?'
        ).bind(transactionId, tagId).run();
        return new Response(JSON.stringify({ success: true }));
    }

    return new Response('Method not allowed', { status: 405 });
}