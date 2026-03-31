// functions/api/stats.js
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type'); // 'monthly' 或其他

    // 原有的汇总统计
    let whereClause = '';
    let params = [];
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
        whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // 如果是请求月度趋势数据
    if (type === 'monthly') {
        // 默认取当前年份，若没有指定年份则用当年
        let targetYear = year ? parseInt(year) : new Date().getFullYear();
        // 查询1-12月的收入支出总和
        const monthlyData = [];
        for (let m = 1; m <= 12; m++) {
            const monthStr = String(m).padStart(2, '0');
            const incomeResult = await env.DB.prepare(`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE strftime("%Y", date) = ? AND strftime("%m", date) = ? AND type = 'income'
            `).bind(targetYear, monthStr).first();
            const expenseResult = await env.DB.prepare(`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE strftime("%Y", date) = ? AND strftime("%m", date) = ? AND type = 'expense'
            `).bind(targetYear, monthStr).first();
            monthlyData.push({
                month: m,
                income: incomeResult.total,
                expense: expenseResult.total
            });
        }
        return new Response(JSON.stringify({ monthlyData, year: targetYear }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 原有的统计逻辑（保持不变）
    const totalsParams = [...params];
    const categoryParams = [...params];

    const totals = await env.DB.prepare(`
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
        FROM transactions
        ${whereClause}
    `).bind(...totalsParams).first();

    let catWhereClause = 'WHERE type = "expense"';
    if (conditions.length > 0) {
        catWhereClause += ' AND ' + conditions.join(' AND ');
    }

    const categoryResults = await env.DB.prepare(`
        SELECT category, SUM(amount) as catAmount
        FROM transactions
        ${catWhereClause}
        GROUP BY category
    `).bind(...categoryParams).all();

    const expenseByCategory = {};
    for (const row of categoryResults.results) {
        expenseByCategory[row.category] = row.catAmount;
    }

    return new Response(JSON.stringify({
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        expenseByCategory
    }), { headers: { 'Content-Type': 'application/json' } });
}