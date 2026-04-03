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

  // 从中间件安全拿登录用户ID
  const userId = context.data.userId;
  if (!userId) {
    return new Response(JSON.stringify({ error: "未授权" }), {
      status: 401,
      headers: corsHeaders
    });
  }

  try {
    // 只查当前用户自己的分类，多用户隔离
    const { results } = await env.DB.prepare(
      "SELECT DISTINCT category FROM transactions WHERE user_id = ? ORDER BY category"
    ).bind(userId).all();

    const dbCategories = results
      .map(row => row.category)
      .filter(c => c && c.trim() !== "");

    const preset = ["餐饮","交通","购物","娱乐","人情往来","医疗","住房","利息","退款","其他"];
    const all = [...new Set([...preset, ...dbCategories])].sort();

    return new Response(JSON.stringify(all), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}