import { supabase } from "@/utils/supabaseClient";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function fetchSubmissions(campaignId: string) {
  await requireUserId();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Basic analytics for a campaign
export async function getCampaignSubmissionStats(campaignId: string) {
  const rows = await fetchSubmissions(campaignId);
  const total = rows.length;
  const checkIns = rows.filter((r: any) => r.is_checkin).length;
  const newCustomers = rows.filter((r: any) => !r.customer_id).length;
  const returningCustomers = total - newCustomers;
  return { total, checkIns, newCustomers, returningCustomers };
}

// Export submissions to CSV
export async function exportCampaignSubmissionsCsv(campaignId: string) {
  const rows = await fetchSubmissions(campaignId);
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];
  for (const row of rows) {
    csvRows.push(
      headers
        .map((h) => {
          const val = row[h];
          return typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
        })
        .join(",")
    );
  }
  return csvRows.join("\n");
}
