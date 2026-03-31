import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaigns } from "@/contexts/CampaignContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, DollarSign, TrendingUp, BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimate } from "@/hooks/useScrollAnimate";

const insightColors: Record<string, string> = {
  success: "border-l-4 border-l-success bg-success/5",
  warning: "border-l-4 border-l-warning bg-warning/5",
  danger: "border-l-4 border-l-destructive bg-destructive/5",
  info: "border-l-4 border-l-info bg-info/5",
};

const Dashboard = () => {
  const { isAdmin, token } = useAuth();
  const { metrics, refresh } = useCampaigns();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  useScrollAnimate();

  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const avgRoi = metrics.length
    ? (metrics.reduce((s, m) => s + (typeof m.roi === "number" ? m.roi : 0), 0) / metrics.length).toFixed(1)
    : "0";

  const handleSync = async () => {
    if (!token) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Sync failed", description: data?.error || "Failed to sync" });
        return;
      }

      await refresh();
      toast({
        title: "Sync complete",
        description: `${data?.adsInserted ?? 0} ads, ${data?.leadsInserted ?? 0} leads, ${data?.ordersInserted ?? 0} orders processed.`,
      });
    } catch {
      toast({ title: "Sync failed", description: "Failed to sync" });
    } finally {
      setSyncing(false);
    }
  };

  const spendRevenueData = metrics.map((m) => ({ name: m.name, Spend: m.spend, Revenue: m.revenue }));
  const roiData = metrics.map((m) => ({ name: m.name, ROI: typeof m.roi === "number" ? m.roi : 0 }));

  const summaryCards = [
    { label: "Total Spend", value: `$${totalSpend.toLocaleString()}`, icon: DollarSign },
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp },
    { label: "Average ROI", value: `${avgRoi}%`, icon: BarChart3 },
    { label: "Total Conversions", value: totalConversions.toString(), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Campaign analytics overview</p>
        </div>
        {isAdmin && (
          <Button onClick={handleSync} disabled={syncing} className="gap-2 hover-glow shrink-0">
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync Data"}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
        {summaryCards.map((c) => (
          <Card key={c.label} className="glass hover-lift cursor-default scroll-animate">
            <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <c.icon size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs text-muted-foreground font-medium truncate">{c.label}</p>
                <p className="text-lg md:text-xl font-bold truncate">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="glass hover-lift scroll-animate">
          <CardContent className="p-4 md:p-5">
            <h3 className="font-semibold mb-4">Spend vs Revenue</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={spendRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(42,25%,88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsla(0,0%,100%,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid hsl(42,25%,88%)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="Spend" fill="hsl(210,70%,55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Revenue" fill="hsl(145,60%,40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass hover-lift scroll-animate">
          <CardContent className="p-4 md:p-5">
            <h3 className="font-semibold mb-4">ROI % per Campaign</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(42,25%,88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsla(0,0%,100%,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid hsl(42,25%,88%)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="ROI" radius={[4, 4, 0, 0]}>
                  {roiData.map((entry, i) => (
                    <Cell key={i} fill={entry.ROI >= 0 ? "hsl(145,60%,40%)" : "hsl(0,72%,55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Table */}
      <Card className="glass overflow-hidden scroll-animate">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="hidden sm:table-cell">Brand</TableHead>
                  <TableHead className="hidden md:table-cell">Channel</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">ROI</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Conv. Rate</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Conversions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Insight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => (
                  <TableRow key={m.campaignId} className="transition-colors duration-200 hover:bg-primary/5">
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{m.brand}</TableCell>
                    <TableCell className="hidden md:table-cell">{m.channel}</TableCell>
                    <TableCell className="text-right">${m.spend.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${m.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{typeof m.roi === "number" ? `${m.roi}%` : m.roi}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {typeof m.conversionRate === "number" ? `${m.conversionRate}%` : m.conversionRate}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">{m.conversions}</TableCell>
                    <TableCell>
                      {m.isUnderperforming ? (
                        <Badge variant="destructive" className="text-xs">Underperforming</Badge>
                      ) : (
                        <Badge className="text-xs bg-success text-success-foreground hover:bg-success/90">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={`inline-block text-xs px-2 py-1 rounded ${insightColors[m.insight.tag]}`}>
                        {m.insight.text}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
