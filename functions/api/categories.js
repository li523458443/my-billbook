export async function onRequest(context) {
    const { env } = context;
    // 从数据库中查询已有的分类
    const { results } = await env.DB.prepare(
        "SELECT DISTINCT category FROM transactions ORDER BY category"
    ).all();
    const dbCategories = results.map(row => row.category).filter(c => c && c.trim() !== '');
    // 预设分类
    const preset = ['餐饮','交通','购物','娱乐','人情往来','医疗','住房','利息','退款','其他'];
    const all = [...new Set([...preset, ...dbCategories])].sort();
    return new Response(JSON.stringify(all), { headers: { 'Content-Type': 'application/json' } });
}