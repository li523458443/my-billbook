export async function onRequest(context) {
  // ✅ 全局 CORS 头（必须加）
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = context.data.userId;

    // ✅ OPTIONS 预检直接放行（解决前端跨域预检失败）
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ❌ 没有 userId 就返回 401（带 CORS 头）
    if (!userId) {
      return new Response(
        JSON.stringify({ error: '未找到用户ID，请检查认证中间件' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type');

    // 月度趋势
    if (type === 'monthly') {
      let targetYear = year ? parseInt(year) : new Date().getFullYear();
      const monthlyData = [];
      for (let m = 1; m <= 12; m++) {
        const monthStr = String(m).padStart(2, '0');
        const incomeResult = await env.DB.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM transactions
          WHERE user_id = ? AND strftime("%Y", date) = ? AND strftime("%m", date) = ? AND type = 'income'
        `).bind(userId, targetYear, monthStr).first();
        const expenseResult = await env.DB.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM transactions
          WHERE user_id = ? AND strftime("%Y", date) = ? AND strftime("%m", date) = ? AND type = 'expense'
        `).bind(userId, targetYear, monthStr).first();
        monthlyData.push({
          month: m,
          income: incomeResult.total,
          expense: expenseResult.total
        });
      }
      // ✅ 成功也带 CORS
      return new Response(JSON.stringify({ monthlyData, year: targetYear }), {
        headers: corsHeaders
      });
    }

    // 汇总统计
    let whereClause = 'WHERE user_id = ?';
    let params = [userId];
    let conditions = [];

    if (year) {
      conditions.push('strftime("%Y", date) = ?');
      params.push(year);
      if (month) {
        conditions.push('strftime("%m", date) = ?');
        params.push(month.padStart(2, '0'));
      }
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      whereClause += ' AND ' + conditions.join(' AND ');
    }

    const totals = await env.DB.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
      FROM transactions
      ${whereClause}
    `).bind(...params).first();

    // 分类统计
    let catParams = [userId];
    let catConditions = [];
    if (year) {
      catConditions.push('strftime("%Y", date) = ?');
      catParams.push(year);
      if (month) {
        catConditions.push('strftime("%m", date) = ?');
        catParams.push(month.padStart(2, '0'));
      }
    }
    if (category) {
      catConditions.push('category = ?');
      catParams.push(category);
    }
    const catWhere = catConditions.length ? ' AND ' + catConditions.join(' AND ') : '';
    const categoryResults = await env.DB.prepare(`
      SELECT category, SUM(amount) as catAmount
      FROM transactions
      WHERE user_id = ? AND type = 'expense' ${catWhere}
      GROUP BY category
    `).bind(...catParams).all();

    const expenseByCategory = {};
    for (const row of categoryResults.results) {
      expenseByCategory[row.category] = row.catAmount;
    }

    // ✅ 最终返回带 CORS
    return new Response(JSON.stringify({
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      expenseByCategory
    }), { headers: corsHeaders });

  } catch (err) {
    // ✅ 错误也带 CORS
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: corsHeaders }
    );
  }
}