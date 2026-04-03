export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PUT,DELETE,OPTIONS",
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

    // 修改交易（快速记账保存）
    if (request.method === 'PUT') {
      const { type, category, amount, date, note, counterparty, source, transaction_id } = await request.json();
      
      await env.DB.prepare(`
        UPDATE transactions 
        SET type = ?, category = ?, amount = ?, date = ?, note = ?, counterparty = ?, source = ?, transaction_id = ?
        WHERE id = ? AND user_id = ?
      `).bind(type, category, amount, date, note || "", counterparty || "", source || "", transaction_id || "", id, userId).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // 删除交易
    if (request.method === 'DELETE') {
      await env.DB.prepare(
        'DELETE FROM transactions WHERE id = ? AND user_id = ?'
      ).bind(id, userId).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404, headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}