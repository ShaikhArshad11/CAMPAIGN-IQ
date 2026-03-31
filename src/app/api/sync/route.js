import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/authMiddleware";
import { runAttribution } from "@/lib/attribution";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request) {
  const { error } = requireAdmin(request);
  if (error) return error;

  try {
    const db = getDb();

    const readJson = (filename) => {
      const filePath = path.join(process.cwd(), "src", "mock-data", filename);
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    };

    const ads = readJson("ads.json");
    const leads = readJson("leads.json");
    const orders = readJson("orders.json");

    const insertCampaign = db.prepare(`
      INSERT OR IGNORE INTO campaigns (id, name, brand, channel, budget, expected_conversions)
      VALUES (@id, @name, @brand, @channel, @budget, @expected_conversions)
    `);

    const insertAd = db.prepare(`
      INSERT OR IGNORE INTO ads (campaign_id, impressions, clicks, spend, source_id)
      VALUES (@campaignId, @impressions, @clicks, @spend, @id)
    `);

    const insertLead = db.prepare(`
      INSERT OR IGNORE INTO leads (campaign_id, email, phone, source_id)
      VALUES (@campaignId, @email, @phone, @id)
    `);

    const insertOrder = db.prepare(`
      INSERT OR IGNORE INTO orders (email, phone, revenue, source_id)
      VALUES (@email, @phone, @revenue, @id)
    `);

    const syncAll = db.transaction(() => {
      // Defer FK checks until commit (still enforces constraints, but allows us to seed IDs first).
      db.exec("PRAGMA defer_foreign_keys = ON");

      const campaignIds = new Set();
      ads.forEach((a) => campaignIds.add(Number(a.campaignId)));
      leads.forEach((l) => campaignIds.add(Number(l.campaignId)));

      // Ensure campaigns exist before inserting rows with foreign keys.
      // If a referenced campaign is missing, seed a placeholder record using the same id.
      [...campaignIds]
        .filter((id) => Number.isFinite(id) && id > 0)
        .forEach((id) => {
        insertCampaign.run({
          id,
          name: `Imported Campaign ${id}`,
          brand: "Imported",
          channel: "Instagram",
          budget: 1000,
          expected_conversions: 100,
        });
      });

      const ensureCampaign = db.prepare("SELECT id FROM campaigns WHERE id = ?");
      [...campaignIds]
        .filter((id) => Number.isFinite(id) && id > 0)
        .forEach((id) => {
          const exists = ensureCampaign.get(id);
          if (!exists) throw new Error(`Missing campaign id ${id} for mock data`);
        });

      ads.forEach((a) => insertAd.run(a));
      leads.forEach((l) => insertLead.run(l));
      orders.forEach((o) => insertOrder.run(o));
    });

    syncAll();

    const attributionResult = runAttribution(db);

    const res = NextResponse.json({
      message: "Sync complete",
      synced: {
        ads: ads.length,
        leads: leads.length,
        orders: orders.length,
      },
      adsInserted: ads.length,
      leadsInserted: leads.length,
      ordersInserted: orders.length,
      attribution: attributionResult,
    });

    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed", detail: err.message }, { status: 500 });
  }
}
