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

    // 事务
    await env.DB.prepare('BEGIN TRANSACTION').run();

    try {
      // 查该用户该月现有预算
      const existing = await env.DB.prepare(`
        SELECT category FROM budgets 
        WHERE user_id = ? AND month = ?
      `).bind(userId, month).all();

      const existingCategories = existing.results.map(r => r.category);
      const newCategories = budgets.map(b => b.category).filter(c => c?.trim());
      const toDelete = existingCategories.filter(c => !newCategories.includes(c));

      // 删除不需要的
      for (const cat of toDelete) {
        await env.DB.prepare(`
          DELETE FROM budgets 
          WHERE user_id = ? AND month = ? AND category = ?
        `).bind(userId, month, cat).run();
      }

      // 插入/更新
      for (const { category, amount } of budgets) {
        if (category && amount > 0) {
          await env.DB.prepare(`
            INSERT INTO budgets (user_id, category, month, amount, updated_at) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) 
            ON CONFLICT(user_id, category, month) 
            DO UPDATE SET amount = excluded.amount, updated_at = CURRENT_TIMESTAMP
          `).bind(userId, category, month, amount).run();
        }
      }

      await env.DB.prepare('COMMIT').run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

    } catch (err) {
      await env.DB.prepare('ROLLBACK').run();
      throw err;
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}