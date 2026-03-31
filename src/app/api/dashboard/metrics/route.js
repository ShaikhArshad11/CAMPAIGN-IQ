import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyAuth } from "@/lib/authMiddleware";
import { generateInsight } from "@/lib/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  const { error } = verifyAuth(request);
  if (error) return error;

  try {
    const db = getDb();
    const campaigns = db.prepare("SELECT * FROM campaigns ORDER BY id ASC").all();

    const metrics = campaigns.map((c) => {
      const adStats = db
        .prepare(
          `
        SELECT
          COALESCE(SUM(spend), 0)       AS spend,
          COALESCE(SUM(clicks), 0)      AS clicks,
          COALESCE(SUM(impressions), 0) AS impressions
        FROM ads WHERE campaign_id = ?
      `,
        )
        .get(c.id);

      const { revenue } = db
        .prepare(
          `
        SELECT COALESCE(SUM(revenue), 0) AS revenue
        FROM orders WHERE attributed_campaign_id = ?
      `,
        )
        .get(c.id);

      const { conversions } = db
        .prepare(
          `
        SELECT COUNT(*) AS conversions
        FROM orders WHERE attributed_campaign_id = ?
      `,
        )
        .get(c.id);

      const spend = adStats.spend;
      const clicks = adStats.clicks;
      const roi = spend > 0 ? parseFloat((((revenue - spend) / spend) * 100).toFixed(1)) : null;
      const conversionRate = clicks > 0 ? parseFloat(((conversions / clicks) * 100).toFixed(2)) : null;

      const expectedConversions = Number(c.expected_conversions) || 0;
      const spendHigh = spend > c.budget * 0.5;
      const roiBad = roi !== null && roi < 0;
      const conversionRateBad = conversionRate !== null && conversionRate < 0.5;
      const farBelowExpected = expectedConversions > 0 && conversions < expectedConversions * 0.3;

      const isUnderperforming = spendHigh && (roiBad || conversionRateBad || farBelowExpected);

      const insight = generateInsight({
        spend,
        revenue,
        roi: roi ?? 0,
        conversionRate: conversionRate ?? 0,
        budget: c.budget,
      });

      return {
        id: c.id,
        name: c.name,
        brand: c.brand,
        channel: c.channel,
        budget: c.budget,
        expectedConversions: c.expected_conversions,
        spend,
        revenue,
        roi,
        conversionRate,
        conversions,
        impressions: adStats.impressions,
        clicks,
        isUnderperforming,
        insight,
      };
    });

    const summary = {
      totalSpend: metrics.reduce((s, m) => s + m.spend, 0),
      totalRevenue: metrics.reduce((s, m) => s + m.revenue, 0),
      totalConversions: metrics.reduce((s, m) => s + m.conversions, 0),
      averageRoi: (() => {
        const valid = metrics.filter((m) => m.roi !== null);
        return valid.length > 0
          ? parseFloat((valid.reduce((s, m) => s + m.roi, 0) / valid.length).toFixed(1))
          : null;
      })(),
    };

    const res = NextResponse.json({ summary, campaigns: metrics });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("Metrics error:", err);
    return NextResponse.json({ error: "Failed to compute metrics" }, { status: 500 });
  }
}
