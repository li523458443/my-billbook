import * as jose from 'jose';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 全局统一CORS头
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };

  // 预检请求直接放行
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 非/api接口直接放行静态资源
  if (!url.pathname.startsWith("/api/")) {
    return next();
  }

  // 公开接口无需鉴权
  const publicPaths = ["/api/login", "/api/register"];
  if (publicPaths.includes(url.pathname)) {
    return next();
  }

  // 取Bearer Token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "未授权，请登录" }), {
      status: 401,
      headers: corsHeaders
    });
  }
  const token = authHeader.slice(7).trim();

  try {
    // 统一：TextEncoder编码秘钥，和登录签发完全一致
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    // Cloudflare 必须用 context.data 向下传递用户ID
    context.data.userId = payload.userId;
    return next();
  } catch (err) {
    return new Response(JSON.stringify({ error: "token 无效或已过期" }), {
      status: 401,
      headers: corsHeaders
    });
  }
}