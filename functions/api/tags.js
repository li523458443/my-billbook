export async function onRequest(context) {
    const { request, env } = context;
    const userId = context.userId;
    const url = new URL(request.url);

    // GET 获取用户所有标签
    if (request.method === 'GET') {
        const { results } = await env.DB.prepare(
            'SELECT id, name FROM tags WHERE user_id = ? ORDER BY name'
        ).bind(userId).all();
        return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    }

    // POST 创建标签
    if (request.method === 'POST') {
        const { name } = await request.json();
        if (!name || name.trim() === '') {
            return new Response(JSON.stringify({ error: '标签名不能为空' }), { status: 400 });
        }
        try {
            const result = await env.DB.prepare(
                'INSERT INTO tags (user_id, name) VALUES (?, ?)'
            ).bind(userId, name.trim()).run();
            return new Response(JSON.stringify({ id: result.meta.last_row_id, name: name.trim() }), { status: 201 });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return new Response(JSON.stringify({ error: '标签已存在' }), { status: 409 });
            }
            throw err;
        }
    }

    return new Response('Method not allowed', { status: 405 });
}