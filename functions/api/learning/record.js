export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
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

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: corsHeaders
      });
    }

    const { counterparty, category } = await request.json();
    if (!counterparty || !category) {
      return new Response(JSON.stringify({ error: '缺少参数' }), {
        status: 400, headers: corsHeaders
      });
    }

    await env.DB.prepare(`
      INSERT INTO learning_rules (user_id, counterparty, category, count, updated_at) 
      VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP) 
      ON CONFLICT(user_id, counterparty, category) 
      DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
    `).bind(userId, counterparty, category).run();

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}