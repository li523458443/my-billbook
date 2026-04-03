import * as jose from 'jose';

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // 只拦截 /api/ 开头的请求，其他请求（如静态资源）直接放行
    if (!url.pathname.startsWith('/api/')) {
        return next();
    }

    // 放行登录和注册接口
    if (url.pathname === '/api/login' || url.pathname === '/api/register') {
        return next();
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
    }

    const token = authHeader.slice(7);
    try {
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        context.userId = payload.userId;
        return next();
    } catch (err) {
        return new Response(JSON.stringify({ error: '无效的token' }), { status: 401 });
    }
}