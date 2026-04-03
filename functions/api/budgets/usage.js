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

    const year = month.split('-')[0];
    const monthNum = month.split('-')[1];

    // 1. 查询当前用户该月预算
    const { results: budgets } = await env.DB.prepare(`
      SELECT category, amount
      FROM budgets
      WHERE user_id = ? AND month = ?
    `).bind(userId, month).all();

    if (budgets.length === 0) {
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }

    // 2. 查询当前用户该月实际支出
    const { results: expenses } = await env.DB.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as spent
      FROM transactions
      WHERE user_id = ?
        AND type = 'expense'
        AND strftime('%Y', date) = ?
        AND strftime('%m', date) = ?
      GROUP BY category
    `).bind(userId, year, monthNum).all();

    // 3. 组装数据
    const spentMap = {};
    expenses.forEach(row => {
      spentMap[row.category] = row.spent;
    });

    const result = budgets.map(b => ({
      category: b.category,
      budget: b.amount,
      spent: spentMap[b.category] || 0,
      remaining: b.amount - (spentMap[b.category] || 0),
      percent: b.amount > 0 ? ((spentMap[b.category] || 0) / b.amount * 100).toFixed(1) : 0
    }));

    return new Response(JSON.stringify(result), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}