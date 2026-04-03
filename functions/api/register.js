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

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "用户名密码不能为空" }), { status: 400, headers: corsHeaders });
    }

    // 检查用户名是否存在
    const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ? LIMIT 1").bind(username).first();
    if (exists) {
      return new Response(JSON.stringify({ error: "用户名已存在" }), { status: 400, headers: corsHeaders });
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ 修复：id 是 INTEGER 自增，不用传！
    await env.DB.prepare(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
    `).bind(username, passwordHash).run();

    return new Response(JSON.stringify({ success: true, message: "注册成功" }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}