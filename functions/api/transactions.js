export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = context.data.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401, headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // ✅ 修复：description → note，完全适配你的表
    const { results } = await env.DB.prepare(`
      SELECT id, type, category, amount, date, note, counterparty, source, transaction_id
      FROM transactions
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    const { total } = await env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM transactions
      WHERE user_id = ?
    `).bind(userId).first();

    return new Response(JSON.stringify({
      list: results,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}