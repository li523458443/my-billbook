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

    // 查询用户（适配你的表结构：password_hash）
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1
    `).bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "账号不存在" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 验证bcrypt哈希密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: "密码错误" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 统一JWT签发
    const secretKey = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secretKey);

    return new Response(JSON.stringify({
      token,
      userId: user.id,
      username: user.username
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}