export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }
    const { password } = await request.json();
    if (password === env.AUTH_PASSWORD) {
        return new Response(JSON.stringify({ success: true }));
    } else {
        return new Response(JSON.stringify({ error: '密码错误' }), { status: 401 });
    }
}