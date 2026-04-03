export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const userId = context.userId; // 从中间件获取

        // 如果没有 userId，说明中间件未生效，返回错误
        if (!userId) {
            return new Response(JSON.stringify({ error: '未找到用户ID，请检查认证中间件' }), { status: 401 });
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

        // 构建分类查询的参数（需要重新构建，因为 params 已被消费）
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

        return new Response(JSON.stringify({
            totalIncome: totals.totalIncome,
            totalExpense: totals.totalExpense,
            expenseByCategory
        }), { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}