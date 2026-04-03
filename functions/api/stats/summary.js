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
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    let where = "user_id = ?";
    const params = [userId];

    if (year) {
      where += " AND strftime('%Y', date) = ?";
      params.push(year);
    }
    if (month) {
      where += " AND strftime('%m', date) = ?";
      params.push(month.padStart(2, '0'));
    }

    const income = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE ${where} AND type = 'income'
    `).bind(...params).first();

    const expense = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE ${where} AND type = 'expense'
    `).bind(...params).first();

    const categories = await env.DB.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) AS total
      FROM transactions WHERE ${where} AND type = 'expense'
      GROUP BY category ORDER BY total DESC
    `).bind(...params).all();

    return new Response(JSON.stringify({
      success: true,
      data: {
        income: Number(income.total),
        expense: Number(expense.total),
        balance: Number(income.total) - Number(expense.total),
        categories: categories.results
      }
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}