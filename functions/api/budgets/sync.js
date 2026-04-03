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

    const { month, budgets } = await request.json();
    if (!month || !Array.isArray(budgets)) {
      return new Response(JSON.stringify({ error: '缺少参数' }), {
        status: 400, headers: corsHeaders
      });
    }

    // ✅ 修复：删除原生 BEGIN/COMMIT，用 D1 原子操作
    // 1. 先查现有预算
    const existing = await env.DB.prepare(`
      SELECT id, category FROM budgets 
      WHERE user_id = ? AND month = ?
    `).bind(userId, month).all();

    const existingCategories = existing.results.map(r => r.category);
    const newCategories = budgets.map(b => b.category).filter(c => c?.trim());
    const toDelete = existingCategories.filter(c => !newCategories.includes(c));

    // 2. 批量删除不需要的预算
    if (toDelete.length > 0) {
      const deleteStmts = toDelete.map(cat => 
        env.DB.prepare(`DELETE FROM budgets WHERE user_id = ? AND month = ? AND category = ?`)
          .bind(userId, month, cat)
      );
      await env.DB.batch(deleteStmts);
    }

    // 3. 批量插入/更新预算
    const upsertStmts = budgets.map(({ category, amount }) => 
      env.DB.prepare(`
        INSERT INTO budgets (user_id, category, month, amount, updated_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) 
        ON CONFLICT(user_id, category, month) 
        DO UPDATE SET amount = excluded.amount, updated_at = CURRENT_TIMESTAMP
      `).bind(userId, category, month, amount)
    );
    await env.DB.batch(upsertStmts);

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}