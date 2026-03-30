export async function onRequest(context) {
    const { request, env, params } = context;
    const id = params.id;

    if (request.method === 'PUT') {
        const { category } = await request.json();
        await env.DB.prepare('UPDATE transactions SET category = ? WHERE id = ?').bind(category, id).run();
        return new Response(JSON.stringify({ success: true }));
    }

    if (request.method === 'DELETE') {
        await env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }));
    }

    return new Response('Not Found', { status: 404 });
}