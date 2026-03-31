import { Campaign, Ad, Lead, Order } from "@/data/mockData";
import { generateInsight, Insight } from "./insights";

export interface CampaignMetric {
  campaignId: number;
  name: string;
  brand: string;
  channel: string;
  budget: number;
  expectedConversions: number;
  spend: number;
  revenue: number;
  roi: number | string;
  conversionRate: number | string;
  conversions: number;
  impressions: number;
  clicks: number;
  isUnderperforming: boolean;
  insight: Insight;
}

export function computeCampaignMetrics(
  campaigns: Campaign[],
  ads: Ad[],
  leads: Lead[],
  attributedOrders: Order[]
): CampaignMetric[] {
  return campaigns.map((c) => {
    const campAds = ads.filter((a) => a.campaignId === c.id);
    const spend = campAds.reduce((s, a) => s + a.spend, 0);
    const impressions = campAds.reduce((s, a) => s + a.impressions, 0);
    const clicks = campAds.reduce((s, a) => s + a.clicks, 0);

    const campOrders = attributedOrders.filter((o) => o.attributedCampaignId === c.id);
    const revenue = campOrders.reduce((s, o) => s + o.revenue, 0);
    const conversions = campOrders.length;

    const roi = spend === 0 ? "N/A" : Math.round(((revenue - spend) / spend) * 1000) / 10;
    const conversionRate = clicks === 0 ? "N/A" : Math.round((conversions / clicks) * 10000) / 100;

    const isUnderperforming = spend > c.budget * 0.5 && conversions < c.expectedConversions * 0.3;

    const insight = generateInsight({ spend, revenue, roi, conversionRate, budget: c.budget, clicks });

    return {
      campaignId: c.id,
      name: c.name,
      brand: c.brand,
      channel: c.channel,
      budget: c.budget,
      expectedConversions: c.expectedConversions,
      spend,
      revenue,
      roi,
      conversionRate,
      conversions,
      impressions,
      clicks,
      isUnderperforming,
      insight,
    };
  });
}
