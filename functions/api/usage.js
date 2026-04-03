export async function onRequest(context) {
  // 必须加 CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
  };

  const { request, env } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get('month');

  // 处理 OPTIONS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ✅ 从中间件拿用户ID
  const userId = context.data.userId;
  if (!userId) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  if (!month) {
    return new Response(JSON.stringify({ error: '缺少 month 参数' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const year = month.split('-')[0];
  const monthNum = month.split('-')[1];

  // ✅ 关键：只查当前用户的预算（必须加 user_id）
  const budgets = await env.DB.prepare(
    `SELECT category, amount FROM budgets 
     WHERE user_id = ? AND month = ?`
  ).bind(userId, month).all();

  if (budgets.results.length === 0) {
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  // ✅ 关键：只查当前用户的支出
  const expenses = await env.DB.prepare(
    `SELECT category, COALESCE(SUM(amount), 0) as spent 
     FROM transactions 
     WHERE user_id = ? 
       AND type = 'expense' 
       AND strftime("%Y", date) = ? 
       AND strftime("%m", date) = ? 
     GROUP BY category`
  ).bind(userId, year, monthNum).all();

  const spentMap = {};
  for (const row of expenses.results) {
    spentMap[row.category] = row.spent;
  }

  const result = budgets.results.map((b) => ({
    category: b.category,
    budget: b.amount,
    spent: spentMap[b.category] || 0,
    remaining: b.amount - (spentMap[b.category] || 0),
    percent: b.amount > 0 ? (((spentMap[b.category] || 0) / b.amount) * 100).toFixed(0) : 0,
  }));

  return new Response(JSON.stringify(result), { headers: corsHeaders });
}