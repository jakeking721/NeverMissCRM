/**
 * Normalize a campaign slug:
 * - lower-case and trim whitespace
 * - replace spaces/underscores with '-'
 * - strip invalid characters
 * - collapse consecutive dashes and trim edges
 */
export function slugifyCampaign(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
