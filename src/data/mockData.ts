export interface Campaign {
  id: number;
  name: string;
  brand: string;
  channel: string;
  budget: number;
  expectedConversions: number;
}

export interface Ad {
  id: string;
  campaignId: number;
  impressions: number;
  clicks: number;
  spend: number;
}

export interface Lead {
  id: string;
  campaignId: number;
  email: string | null;
  phone: string | null;
}

export interface Order {
  id: string;
  email: string | null;
  phone: string | null;
  revenue: number;
  attributedCampaignId?: number | null;
}

export const initialCampaigns: Campaign[] = [
  { id: 1, name: "Summer Blaze", brand: "Nike", channel: "Instagram", budget: 5000, expectedConversions: 200 },
  { id: 2, name: "Tech Forward", brand: "Samsung", channel: "YouTube", budget: 8000, expectedConversions: 300 },
  { id: 3, name: "Fresh Vibes", brand: "Zara", channel: "Facebook", budget: 3000, expectedConversions: 150 },
  { id: 4, name: "Peak Season", brand: "Adidas", channel: "Instagram", budget: 6000, expectedConversions: 250 },
  { id: 5, name: "Click Storm", brand: "Apple", channel: "Google Ads", budget: 10000, expectedConversions: 400 },
];

export const ads: Ad[] = [
  { id: "ad_001", campaignId: 1, impressions: 52000, clicks: 1300, spend: 2800 },
  { id: "ad_002", campaignId: 2, impressions: 80000, clicks: 900, spend: 7200 },
  { id: "ad_003", campaignId: 3, impressions: 21000, clicks: 540, spend: 1100 },
  { id: "ad_004", campaignId: 4, impressions: 63000, clicks: 2100, spend: 3900 },
  { id: "ad_005", campaignId: 5, impressions: 95000, clicks: 3800, spend: 9500 },
];

export const leads: Lead[] = [
  { id: "lead_001", campaignId: 1, email: "alice@example.com", phone: null },
  { id: "lead_002", campaignId: 1, email: "bob@example.com", phone: null },
  { id: "lead_003", campaignId: 2, email: null, phone: "+91-9876543210" },
  { id: "lead_004", campaignId: 2, email: "carol@example.com", phone: null },
  { id: "lead_005", campaignId: 3, email: "dave@example.com", phone: null },
  { id: "lead_006", campaignId: 4, email: null, phone: "+91-9123456780" },
  { id: "lead_007", campaignId: 4, email: "eve@example.com", phone: null },
  { id: "lead_008", campaignId: 5, email: "frank@example.com", phone: null },
  { id: "lead_009", campaignId: 5, email: null, phone: "+91-9001234567" },
];

export const orders: Order[] = [
  { id: "ord_001", email: "alice@example.com", phone: null, revenue: 2500 },
  { id: "ord_002", email: "bob@example.com", phone: null, revenue: 1800 },
  { id: "ord_003", email: null, phone: "+91-9876543210", revenue: 4200 },
  { id: "ord_004", email: "carol@example.com", phone: null, revenue: 3100 },
  { id: "ord_005", email: "dave@example.com", phone: null, revenue: 900 },
  { id: "ord_006", email: null, phone: "+91-9123456780", revenue: 5500 },
  { id: "ord_007", email: "eve@example.com", phone: null, revenue: 2200 },
  { id: "ord_008", email: "frank@example.com", phone: null, revenue: 7800 },
  { id: "ord_009", email: null, phone: "+91-9001234567", revenue: 3300 },
  { id: "ord_010", email: "ghost@example.com", phone: null, revenue: 1500 },
];

export const channels = ["Instagram", "YouTube", "Facebook", "Google Ads", "Twitter/X", "LinkedIn"];
