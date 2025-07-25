// src/services/analyticsService.ts
// ------------------------------------------------------------------------------------
// analyticsService: stub data for charts (credits usage, customers, campaigns)
// ------------------------------------------------------------------------------------

export type CreditUsageEntry = { date: string; creditsUsed: number };
export type CustomerGrowthEntry = { date: string; totalCustomers: number };
export type CampaignStatsEntry = { name: string; sent: number; scheduled: number };

export function getCreditUsage(): CreditUsageEntry[] {
  // Fake data for the last 7 days
  const today = new Date();
  const data: CreditUsageEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      creditsUsed: Math.floor(Math.random() * 50) + 10,
    });
  }
  return data;
}

export function getCustomerGrowth(): CustomerGrowthEntry[] {
  const today = new Date();
  const data: CustomerGrowthEntry[] = [];
  let total = 100;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    total += Math.floor(Math.random() * 5);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      totalCustomers: total,
    });
  }
  return data;
}

export function getCampaignStats(): CampaignStatsEntry[] {
  return [
    { name: "Spring Promo", sent: 120, scheduled: 30 },
    { name: "Event Blast", sent: 80, scheduled: 10 },
    { name: "Holiday Offer", sent: 50, scheduled: 20 },
  ];
}
