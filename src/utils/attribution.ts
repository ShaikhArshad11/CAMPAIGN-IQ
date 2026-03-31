import { Lead, Order } from "@/data/mockData";

export function attributeOrders(leads: Lead[], orders: Order[]): Order[] {
  return orders.map((order) => {
    let matchedLeads: Lead[] = [];

    if (order.email) {
      matchedLeads = leads.filter((l) => l.email === order.email);
    }

    if (matchedLeads.length === 0 && order.phone) {
      matchedLeads = leads.filter((l) => l.phone === order.phone);
    }

    if (matchedLeads.length === 0) {
      return { ...order, attributedCampaignId: null };
    }

    // last-touch: highest id
    const lastTouch = matchedLeads.sort((a, b) => b.id.localeCompare(a.id))[0];
    return { ...order, attributedCampaignId: lastTouch.campaignId };
  });
}
