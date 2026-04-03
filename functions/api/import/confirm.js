export async function onRequest(context) {
    const { request, env } = context;
    const userId = context.userId;
    const { newItems, overwrites } = await request.json();
    let inserted = 0, updated = 0;

    if (newItems && newItems.length) {
        const batchSize = 50;
        for (let i = 0; i < newItems.length; i += batchSize) {
            const batch = newItems.slice(i, i + batchSize);
            const statements = batch.map(t =>
                env.DB.prepare(
                    `INSERT INTO transactions (date, type, amount, counterparty, note, category, source, transaction_id, user_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(t.date, t.type, t.amount, t.counterparty || '', t.note || '', t.category, t.source || '', t.transactionId || '', userId)
            );
            await env.DB.batch(statements);
        }
        inserted = newItems.length;
    }

    if (overwrites && overwrites.length) {
        for (const t of overwrites) {
            await env.DB.prepare(
                `UPDATE transactions 
                 SET date = ?, type = ?, amount = ?, counterparty = ?, note = ?, category = ?, source = ?, transaction_id = ?
                 WHERE id = ? AND user_id = ?`
            ).bind(t.date, t.type, t.amount, t.counterparty || '', t.note || '', t.category, t.source || '', t.transactionId || '', t.existingId, userId).run();
            updated++;
        }
    }

    return new Response(JSON.stringify({ success: true, inserted, updated, message: `导入 ${inserted} 新记录，覆盖 ${updated} 重复记录` }));
}