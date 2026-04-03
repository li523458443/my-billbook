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
    const counterparty = url.searchParams.get('counterparty');
    if (!counterparty) {
      return new Response(JSON.stringify({ error: '缺少对方名称' }), {
        status: 400, headers: corsHeaders
      });
    }

    const rule = await env.DB.prepare(`
      SELECT category FROM learning_rules 
      WHERE user_id = ? AND counterparty = ? 
      ORDER BY count DESC LIMIT 1
    `).bind(userId, counterparty).first();

    return new Response(JSON.stringify({ category: rule?.category || null }), {
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}