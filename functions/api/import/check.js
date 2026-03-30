export async function onRequest(context) {
    const { request, env } = context;
    const { transactions } = await request.json();
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return new Response(JSON.stringify({ error: '没有数据' }), { status: 400 });
    }

    const newItems = [];
    const duplicates = [];

    for (const t of transactions) {
        let existing = null;
        let reason = '';
        if (t.transactionId && t.transactionId.trim()) {
            existing = await env.DB.prepare(
                'SELECT id, date, amount, counterparty, type, category, source FROM transactions WHERE transaction_id = ?'
            ).bind(t.transactionId).first();
            if (existing) reason = `订单号重复 (已有记录 ID=${existing.id})`;
        }
        if (!existing && (!t.transactionId || !t.transactionId.trim())) {
            existing = await env.DB.prepare(
                'SELECT id, date, amount, counterparty, type, category, source FROM transactions WHERE date = ? AND amount = ? AND counterparty = ? AND type = ?'
            ).bind(t.date, t.amount, t.counterparty || '', t.type).first();
            if (existing) reason = `复合键重复 (ID=${existing.id})`;
        }
        if (existing) {
            duplicates.push({ ...t, existingId: existing.id, existingDate: existing.date, existingAmount: existing.amount, existingCounterparty: existing.counterparty, existingType: existing.type, existingCategory: existing.category, existingSource: existing.source, duplicateReason: reason });
        } else {
            newItems.push(t);
        }
    }
    return new Response(JSON.stringify({ newItems, duplicates }));
}