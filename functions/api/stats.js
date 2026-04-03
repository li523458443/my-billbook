export async function onRequest(context) {
    const { request, env } = context;
    const userId = context.userId;
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type'); // 'monthly' 或其他

    // 月度趋势数据
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
        return new Response(JSON.stringify({ monthlyData, year: targetYear }), {
            headers: { 'Content-Type': 'application/json' }
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

    const totalsParams = [...params];
    const categoryParams = [...params];

    const totals = await env.DB.prepare(`
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
        FROM transactions
        ${whereClause}
    `).bind(...totalsParams).first();

    let catWhereClause = 'WHERE user_id = ? AND type = "expense"';
    const catParams = [userId];
    if (conditions.length > 0) {
        catWhereClause += ' AND ' + conditions.join(' AND ');
        catParams.push(...conditions.map(() => params.shift())); // 注意：参数顺序需要处理，简单起见重新构建
        // 为了准确，我们重新构建 category 查询
    }
    // 重新构建分类查询参数（避免混乱）
    let catConditions = [];
    let catValues = [userId];
    if (year) {
        catConditions.push('strftime("%Y", date) = ?');
        catValues.push(year);
        if (month) {
            catConditions.push('strftime("%m", date) = ?');
            catValues.push(month.padStart(2, '0'));
        }
    }
    if (category) {
        catConditions.push('category = ?');
        catValues.push(category);
    }
    const catWhere = catConditions.length ? ' AND ' + catConditions.join(' AND ') : '';
    const categoryResults = await env.DB.prepare(`
        SELECT category, SUM(amount) as catAmount
        FROM transactions
        WHERE user_id = ? AND type = 'expense' ${catWhere}
        GROUP BY category
    `).bind(...catValues).all();

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