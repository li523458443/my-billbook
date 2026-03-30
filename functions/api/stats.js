export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');

    let where = '';
    const params = [];
    if (year) {
        where += ' WHERE strftime("%Y", date) = ?';
        params.push(year);
        if (month) {
            where += ' AND strftime("%m", date) = ?';
            params.push(month.padStart(2, '0'));
        }
    }
    if (category) {
        where += (where ? ' AND' : ' WHERE') + ' category = ?';
        params.push(category);
    }

    const totals = await env.DB.prepare(`
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
        FROM transactions ${where}
    `).bind(...params).first();

    let catWhere = ' WHERE type = "expense"';
    if (year) {
        catWhere += ` AND strftime("%Y", date) = ?`;
        if (month) catWhere += ` AND strftime("%m", date) = ?`;
    }
    if (category) catWhere += ` AND category = ?`;

    const catParams = [...params];
    const catResults = await env.DB.prepare(`
        SELECT category, SUM(amount) as catAmount
        FROM transactions ${catWhere}
        GROUP BY category
    `).bind(...catParams).all();

    const expenseByCategory = {};
    for (const row of catResults.results) {
        expenseByCategory[row.category] = row.catAmount;
    }

    return new Response(JSON.stringify({
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        expenseByCategory
    }));
}