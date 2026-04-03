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
    if (!userId) return new Response(JSON.stringify({ success: false, error: "未授权" }), { status: 401, headers: corsHeaders });

    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    if (!month) return new Response(JSON.stringify({ success: false, error: "缺少月份" }), { status: 400, headers: corsHeaders });

    const year = month.slice(0, 4);
    const monthNum = month.slice(5, 7);

    const budgets = await env.DB.prepare(`
      SELECT category, amount FROM budgets WHERE user_id = ? AND month = ?
    `).bind(userId, month).all();

    if (budgets.results.length === 0) {
      return new Response(JSON.stringify({ success: true, data: [] }), { headers: corsHeaders });
    }

    const expenses = await env.DB.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) AS used
      FROM transactions
      WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
      GROUP BY category
    `).bind(userId, year, monthNum).all();

    const map = {};
    for (const e of expenses.results) map[e.category] = Number(e.used);

    const result = budgets.results.map(b => {
      const used = map[b.category] || 0;
      const budget = Number(b.amount);
      const percent = budget === 0 ? 0 : Math.min(100, (used / budget * 100).toFixed(1));
      return {
        category: b.category,
        budget,
        used,
        remaining: budget - used,
        percent: Number(percent),
        status: percent >= 100 ? "over" : percent >= 80 ? "warn" : "normal"
      };
    });

    return new Response(JSON.stringify({ success: true, data: result }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}