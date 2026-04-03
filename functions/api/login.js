import * as jose from 'jose';

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    // ========== 这里替换成你真实D1用户查询逻辑 ==========
    // 示例查用户，你自己表结构对应改
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE username = ? AND password = ? LIMIT 1"
    ).bind(username, password).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "账号密码错误" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 🔴【最关键统一步骤】和校验端秘钥编码完全一致
    const secretKey = new TextEncoder().encode(env.JWT_SECRET);

    // 签发标准HS256 JWT，有效期30天可改
    const token = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secretKey);

    return new Response(JSON.stringify({ token }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}