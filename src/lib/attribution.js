// Last-touch attribution model:
// 1. Match order → lead by email (preferred)
// 2. Fallback to phone match
// 3. If multiple leads match, use the highest id (most recent = last touch)
// 4. Unmatched orders get attributed_campaign_id = NULL

export function runAttribution(db) {
  const unattributed = db.prepare(`SELECT * FROM orders WHERE attributed_campaign_id IS NULL`).all();

  const updateOrder = db.prepare(`UPDATE orders SET attributed_campaign_id = ? WHERE id = ?`);

  const results = { attributed: 0, unmatched: 0 };

  const attributeMany = db.transaction(() => {
    for (const order of unattributed) {
      let lead = null;

      // Step 1: try email match
      if (order.email) {
        lead = db.prepare(`SELECT * FROM leads WHERE email = ? ORDER BY id DESC LIMIT 1`).get(order.email);
      }

      // Step 2: fallback to phone match
      if (!lead && order.phone) {
        lead = db.prepare(`SELECT * FROM leads WHERE phone = ? ORDER BY id DESC LIMIT 1`).get(order.phone);
      }

      if (lead) {
        updateOrder.run(lead.campaign_id, order.id);
        results.attributed++;
      } else {
        results.unmatched++;
      }
    }
  });

  attributeMany();
  return results;
}
