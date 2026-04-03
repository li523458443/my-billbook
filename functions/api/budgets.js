export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = context.data.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month');

    if (!month) {
      return new Response(JSON.stringify({ error: "缺少month参数" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 查询当前用户该月预算
    const { results } = await env.DB.prepare(`
      SELECT id, category, amount, month
      FROM budgets
      WHERE user_id = ? AND month = ?
      ORDER BY category
    `).bind(userId, month).all();

    return new Response(JSON.stringify(results), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}