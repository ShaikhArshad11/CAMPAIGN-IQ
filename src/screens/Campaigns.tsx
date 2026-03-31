import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaigns } from "@/contexts/CampaignContext";
import type { Campaign } from "@/data/mockData";
import { channels } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { useScrollAnimate } from "@/hooks/useScrollAnimate";

const emptyCampaign = { name: "", brand: "", channel: "Instagram", budget: 0, expectedConversions: 0 };

const Campaigns = () => {
  const { isAdmin } = useAuth();
  const { campaigns, metrics, loading, addCampaign, updateCampaign, deleteCampaign } = useCampaigns();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyCampaign);
  const [actionError, setActionError] = useState<string | null>(null);

  useScrollAnimate();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCampaign);
    setActionError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({ name: c.name, brand: c.brand, channel: c.channel, budget: c.budget, expectedConversions: c.expectedConversions });
    setActionError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setActionError(null);

    const err = editing
      ? await updateCampaign({ ...editing, ...form })
      : await addCampaign(form);

    if (err) return setActionError(err);
    setModalOpen(false);
  };

  const getMetric = (id: number) => metrics.find((m) => m.campaignId === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage your marketing campaigns</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2 hover-glow shrink-0">
            <Plus size={16} />
            New Campaign
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground scroll-animate">
          Loading...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground scroll-animate">
          <Megaphone size={48} className="mb-4 opacity-40" />
          <p className="text-lg font-medium">No campaigns yet</p>
          <p className="text-sm">Create your first campaign to get started.</p>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="grid grid-cols-1 gap-3 md:hidden stagger-children">
            {campaigns.map((c) => {
              const m = getMetric(c.id);
              return (
                <Card key={c.id} className="glass hover-lift scroll-animate">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.brand} · {c.channel}</p>
                      </div>
                      {m?.isUnderperforming ? (
                        <Badge variant="destructive" className="text-[10px]">Underperforming</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-success text-success-foreground">Active</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Budget</span>
                        <p className="font-medium">${c.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected Conv.</span>
                        <p className="font-medium">{c.expectedConversions}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => openEdit(c)}>
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            const err = await deleteCampaign(c.id);
                            if (err) setActionError(err);
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block border rounded-lg overflow-hidden glass scroll-animate">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Expected Conv.</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const m = getMetric(c.id);
                    return (
                      <TableRow key={c.id} className="transition-colors duration-200 hover:bg-primary/5">
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.brand}</TableCell>
                        <TableCell>{c.channel}</TableCell>
                        <TableCell className="text-right">${c.budget.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.expectedConversions}</TableCell>
                        <TableCell>
                          {m?.isUnderperforming ? (
                            <Badge variant="destructive" className="text-xs">Underperforming</Badge>
                          ) : (
                            <Badge className="text-xs bg-success text-success-foreground hover:bg-success/90">Active</Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors" onClick={() => openEdit(c)}>
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-destructive/10 transition-colors"
                              onClick={async () => {
                                const err = await deleteCampaign(c.id);
                                if (err) setActionError(err);
                              }}
                            >
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-strong max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {actionError && <div className="text-sm text-destructive">{actionError}</div>}
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Budget ($)</Label>
                <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Expected Conv.</Label>
                <Input type="number" value={form.expectedConversions} onChange={(e) => setForm({ ...form, expectedConversions: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
