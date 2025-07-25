// src/pages/Analytics.tsx
// ------------------------------------------------------------------------------------
// Analytics Page
// - Displays credits usage, customer growth, and campaign performance using Recharts
// - Data is currently stubbed via analyticsService
// ------------------------------------------------------------------------------------

import React from "react";
import PageShell from "../components/PageShell";
import {
  getCreditUsage,
  getCustomerGrowth,
  getCampaignStats,
  CreditUsageEntry,
  CustomerGrowthEntry,
  CampaignStatsEntry,
} from "../services/analyticsService";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function Analytics() {
  const [creditsData, setCreditsData] = React.useState<CreditUsageEntry[]>([]);
  const [customerData, setCustomerData] = React.useState<CustomerGrowthEntry[]>([]);
  const [campaignData, setCampaignData] = React.useState<CampaignStatsEntry[]>([]);

  React.useEffect(() => {
    setCreditsData(getCreditUsage());
    setCustomerData(getCustomerGrowth());
    setCampaignData(getCampaignStats());
  }, []);

  return (
    <PageShell faintFlag>
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-semibold mb-2">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600">
            Visual overview of credits usage, customer growth, and campaign performance (stubbed
            data).
          </p>
        </header>

        {/* Credits Usage Chart */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Credits Usage (Last 7 Days)</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <LineChart data={creditsData}>
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="creditsUsed" stroke="#1e3a8a" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Customer Growth Chart */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Customer Growth (Last 7 Days)</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <AreaChart data={customerData}>
                <defs>
                  <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="totalCustomers"
                  stroke="#1e3a8a"
                  fillOpacity={1}
                  fill="url(#colorCustomers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Campaign Performance */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Campaign Performance</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#2563eb" />
                <Bar dataKey="scheduled" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
