import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

    // 校验输入
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "用户名和密码不能为空" }), {
        status: 400, headers: corsHeaders
      });
    }

    // 检查用户名是否已存在
    const existingUser = await env.DB.prepare(`
      SELECT id FROM users WHERE username = ? LIMIT 1
    `).bind(username).first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: "用户名已存在" }), {
        status: 400, headers: corsHeaders
      });
    }

    // ✅ 生成bcrypt哈希，存到password_hash字段
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ✅ 生成唯一用户ID（用uuid）
    const userId = uuidv4();

    // ✅ 完全适配你的表结构插入
    await env.DB.prepare(`
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(userId, username, passwordHash).run();

    return new Response(JSON.stringify({ success: true, message: "注册成功" }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}