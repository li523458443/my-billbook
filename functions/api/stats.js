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
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type');

    // 月度趋势
    if (type === 'monthly') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const monthlyData = [];

      for (let m = 1; m <= 12; m++) {
        const monthStr = String(m).padStart(2, '0');
        const income = await env.DB.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM transactions
          WHERE user_id = ?
            AND type = 'income'
            AND strftime('%Y', date) = ?
            AND strftime('%m', date) = ?
        `).bind(userId, targetYear, monthStr).first();

        const expense = await env.DB.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM transactions
          WHERE user_id = ?
            AND type = 'expense'
            AND strftime('%Y', date) = ?
            AND strftime('%m', date) = ?
        `).bind(userId, targetYear, monthStr).first();

        monthlyData.push({
          month: m,
          income: income.total,
          expense: expense.total
        });
      }

      return new Response(JSON.stringify({
        monthlyData,
        year: targetYear
      }), { headers: corsHeaders });
    }

    // 汇总统计
    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (year) {
      whereClause += ' AND strftime("%Y", date) = ?';
      params.push(year);
      if (month) {
        whereClause += ' AND strftime("%m", date) = ?';
        params.push(month.padStart(2, '0'));
      }
    }
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    // 查询总收入/总支出
    const totals = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
      FROM transactions
      ${whereClause}
    `).bind(...params).first();

    // 查询分类支出
    let catWhere = 'WHERE user_id = ? AND type = "expense"';
    let catParams = [userId];

    if (year) {
      catWhere += ' AND strftime("%Y", date) = ?';
      catParams.push(year);
      if (month) {
        catWhere += ' AND strftime("%m", date) = ?';
        catParams.push(month.padStart(2, '0'));
      }
    }
    if (category) {
      catWhere += ' AND category = ?';
      catParams.push(category);
    }

    const { results: categoryResults } = await env.DB.prepare(`
      SELECT category, SUM(amount) as catAmount
      FROM transactions
      ${catWhere}
      GROUP BY category
    `).bind(...catParams).all();

    const expenseByCategory = {};
    categoryResults.forEach(row => {
      expenseByCategory[row.category] = row.catAmount;
    });

    return new Response(JSON.stringify({
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      expenseByCategory
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}