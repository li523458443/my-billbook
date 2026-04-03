export async function onRequest(context) {
  const { request, env } = context;

  // 统一跨域头
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };

  // 处理 OPTIONS 预检
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ 修复：从 context.data 拿 userId
    const userId = context.data.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "未授权" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const url = new URL(request.url);

    // GET 获取用户所有标签
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, name FROM tags WHERE user_id = ? ORDER BY name'
      ).bind(userId).all();

      return new Response(JSON.stringify(results), { headers: corsHeaders });
    }

    // POST 创建标签
    if (request.method === 'POST') {
      const { name } = await request.json();

      if (!name || name.trim() === '') {
        return new Response(
          JSON.stringify({ error: '标签名不能为空' }),
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        const result = await env.DB.prepare(
          'INSERT INTO tags (user_id, name) VALUES (?, ?)'
        ).bind(userId, name.trim()).run();

        return new Response(
          JSON.stringify({
            id: result.meta.last_row_id,
            name: name.trim()
          }),
          { status: 201, headers: corsHeaders }
        );
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return new Response(
            JSON.stringify({ error: '标签已存在' }),
            { status: 409, headers: corsHeaders }
          );
        }
        throw err;
      }
    }

    // 不支持的方法
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );

  } catch (err) {
    // 全局异常捕获，防止返回 HTML
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}