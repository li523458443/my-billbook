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
      return new Response(JSON.stringify({ success: false, error: "未授权" }), {
        status: 401, headers: corsHeaders
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: "方法不支持" }), {
        status: 405, headers: corsHeaders
      });
    }

    const { month, budgets } = await request.json();
    if (!month || !Array.isArray(budgets)) {
      return new Response(JSON.stringify({ success: false, error: "参数错误" }), {
        status: 400, headers: corsHeaders
      });
    }

    const validBudgets = budgets.filter(b => b.category && b.category.trim() && b.amount > 0);

    const existing = await env.DB.prepare(`
      SELECT category FROM budgets WHERE user_id = ? AND month = ?
    `).bind(userId, month).all();

    const existCats = existing.results.map(r => r.category);
    const toDelete = existCats.filter(c => !validBudgets.some(v => v.category === c));

    for (const cat of toDelete) {
      await env.DB.prepare(`
        DELETE FROM budgets WHERE user_id = ? AND month = ? AND category = ?
      `).bind(userId, month, cat).run();
    }

    for (const { category, amount } of validBudgets) {
      await env.DB.prepare(`
        INSERT INTO budgets (user_id, category, month, amount)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, category, month)
        DO UPDATE SET amount = excluded.amount
      `).bind(userId, category.trim(), month, amount).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: "保存成功",
      data: validBudgets
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500, headers: corsHeaders });
  }
}