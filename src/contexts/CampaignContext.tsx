import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Campaign } from "@/data/mockData";
import type { CampaignMetric } from "@/utils/metrics";
import { useAuth } from "@/contexts/AuthContext";

interface CampaignContextType {
  campaigns: Campaign[];
  metrics: CampaignMetric[];
  loading: boolean;
  refresh: () => Promise<void>;
  addCampaign: (c: Omit<Campaign, "id">) => Promise<string | null>;
  updateCampaign: (c: Campaign) => Promise<string | null>;
  deleteCampaign: (id: number) => Promise<string | null>;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

type DbCampaign = {
  id: number;
  name: string;
  brand: string;
  channel: string;
  budget: number;
  expected_conversions: number;
};

type ApiMetricsResponse = {
  summary: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    averageRoi: number | null;
  };
  campaigns: Array<{
    id: number;
    name: string;
    brand: string;
    channel: string;
    budget: number;
    expectedConversions: number;
    spend: number;
    revenue: number;
    roi: number | null;
    conversionRate: number | null;
    conversions: number;
    impressions: number;
    clicks: number;
    isUnderperforming: boolean;
    insight: { tag: "warning" | "success" | "danger" | "info"; text: string };
  }>;
};

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeCampaign(row: DbCampaign): Campaign {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    channel: row.channel,
    budget: row.budget,
    expectedConversions: row.expected_conversions,
  };
}

function normalizeMetric(m: ApiMetricsResponse["campaigns"][number]): CampaignMetric {
  return {
    campaignId: m.id,
    name: m.name,
    brand: m.brand,
    channel: m.channel,
    budget: m.budget,
    expectedConversions: m.expectedConversions,
    spend: m.spend,
    revenue: m.revenue,
    roi: m.roi === null ? "N/A" : m.roi,
    conversionRate: m.conversionRate === null ? "N/A" : m.conversionRate,
    conversions: m.conversions,
    impressions: m.impressions,
    clicks: m.clicks,
    isUnderperforming: m.isUnderperforming,
    insight: m.insight,
  };
}

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!token) return;

    const [campaignsRes, metricsRes] = await Promise.all([
      fetch("/api/campaigns", { headers: { ...authHeaders(token) }, cache: "no-store" }),
      fetch("/api/dashboard/metrics", { headers: { ...authHeaders(token) }, cache: "no-store" }),
    ]);

    if (!campaignsRes.ok) throw new Error("Failed to load campaigns");
    if (!metricsRes.ok) throw new Error("Failed to load metrics");

    const campaignsData: DbCampaign[] = await campaignsRes.json();
    const metricsData: ApiMetricsResponse = await metricsRes.json();

    setCampaigns(campaignsData.map(normalizeCampaign));
    setMetrics(metricsData.campaigns.map(normalizeMetric));
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token || !user) {
        setCampaigns([]);
        setMetrics([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await refresh();
      } catch {
        if (!cancelled) {
          setCampaigns([]);
          setMetrics([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const addCampaign = async (c: Omit<Campaign, "id">): Promise<string | null> => {
    if (!token) return "Not authenticated";

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          name: c.name,
          brand: c.brand,
          channel: c.channel,
          budget: c.budget,
          expected_conversions: c.expectedConversions,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data?.error || "Failed to create campaign";

      setCampaigns((prev) => [normalizeCampaign(data as DbCampaign), ...prev]);
      await refresh();
      return null;
    } catch {
      return "Failed to create campaign";
    }
  };

  const updateCampaign = async (c: Campaign): Promise<string | null> => {
    if (!token) return "Not authenticated";

    try {
      const res = await fetch(`/api/campaigns/${c.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          name: c.name,
          brand: c.brand,
          channel: c.channel,
          budget: c.budget,
          expected_conversions: c.expectedConversions,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data?.error || "Failed to update campaign";

      setCampaigns((prev) => prev.map((x) => (x.id === c.id ? normalizeCampaign(data as DbCampaign) : x)));
      await refresh();
      return null;
    } catch {
      return "Failed to update campaign";
    }
  };

  const deleteCampaign = async (id: number): Promise<string | null> => {
    if (!token) return "Not authenticated";

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders(token),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data?.error || "Failed to delete campaign";

      setCampaigns((prev) => prev.filter((x) => x.id !== id));
      await refresh();
      return null;
    } catch {
      return "Failed to delete campaign";
    }
  };

  const stableMetrics = useMemo(() => metrics, [metrics]);

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        metrics: stableMetrics,
        loading,
        refresh,
        addCampaign,
        updateCampaign,
        deleteCampaign,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaigns must be used within CampaignProvider");
  return ctx;
};
