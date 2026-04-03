export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ 修复：从 context.data 拿 userId
    const userId = context.data.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { transactions } = await request.json();
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return new Response(JSON.stringify({ error: "没有数据" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const newItems = [];
    const duplicates = [];

    for (const t of transactions) {
      let existing = null;
      let reason = "";

      if (t.transactionId && t.transactionId.trim()) {
        existing = await env.DB.prepare(`
          SELECT id, date, amount, counterparty, type, category, source 
          FROM transactions 
          WHERE user_id = ? AND transaction_id = ?
        `).bind(userId, t.transactionId).first();

        if (existing) {
          reason = `订单号重复 (已有记录 ID=${existing.id})`;
        }
      }

      if (!existing && (!t.transactionId || !t.transactionId.trim())) {
        existing = await env.DB.prepare(`
          SELECT id, date, amount, counterparty, type, category, source 
          FROM transactions 
          WHERE user_id = ? 
            AND date = ? 
            AND amount = ? 
            AND counterparty = ? 
            AND type = ?
        `).bind(userId, t.date, t.amount, t.counterparty || "", t.type).first();

        if (existing) {
          reason = `复合键重复 (ID=${existing.id})`;
        }
      }

      if (existing) {
        duplicates.push({
          ...t,
          existingId: existing.id,
          existingDate: existing.date,
          existingAmount: existing.amount,
          existingCounterparty: existing.counterparty,
          existingType: existing.type,
          existingCategory: existing.category,
          existingSource: existing.source,
          duplicateReason: reason,
        });
      } else {
        newItems.push(t);
      }
    }

    return new Response(JSON.stringify({ newItems, duplicates }), {
      headers: corsHeaders,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}