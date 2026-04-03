import * as jose from 'jose';
import bcrypt from 'bcryptjs';

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
    const { username, password } = await request.json();

    // 查询用户
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1
    `).bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "账号不存在" }), { status: 400, headers: corsHeaders });
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ error: "密码错误" }), { status: 400, headers: corsHeaders });
    }

    // 签发 JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret);

    return new Response(JSON.stringify({ token }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}