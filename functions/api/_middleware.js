import * as jose from 'jose';

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // --- 1. 统一 CORS 响应头（解决跨域报错）---
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Content-Type': 'application/json',
    };

    // --- 2. 处理 OPTIONS 预检请求（必须放行）---
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // --- 3. 只拦截 /api/ 开头的请求 ---
    if (!url.pathname.startsWith('/api/')) {
        const response = await next();
        // 给静态资源也加上 CORS
        const corsResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            corsResponse.headers.set(key, value);
        });
        return corsResponse;
    }

    // --- 4. 放行登录注册 ---
    if (url.pathname === '/api/login' || url.pathname === '/api/register') {
        const response = await next();
        const corsResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            corsResponse.headers.set(key, value);
        });
        return corsResponse;
    }

    // --- 5. 获取 Token ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
            JSON.stringify({ error: '未授权，请先登录' }),
            { status: 401, headers: corsHeaders }
        );
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        return new Response(
            JSON.stringify({ error: 'token 不能为空' }),
            { status: 401, headers: corsHeaders }
        );
    }

    // --- 6. 验证 JWT ---
    try {
        // 检查环境变量
        if (!env.JWT_SECRET) {
            throw new Error('JWT_SECRET 未配置');
        }

        const secret = new TextEncoder().encode(env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);

        // 将用户信息传入上下文
        context.userId = payload.userId;

        // 继续执行并添加跨域头
        const response = await next();
        const corsResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            corsResponse.headers.set(key, value);
        });
        return corsResponse;

    } catch (err) {
        console.error('JWT 验证失败:', err.message);
        return new Response(
            JSON.stringify({ error: 'token 无效或已过期' }),
            { status: 401, headers: corsHeaders }
        );
    }
}