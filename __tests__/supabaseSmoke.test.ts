import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Supabase REST URLs', () => {
  it('preserves query string when inserting into campaign_forms', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      );
    const client = createClient('https://example.supabase.co', 'anon');
    await client.from('campaign_forms').insert([{ title: 'x', schema_json: {} }]).select();
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/rest/v1/campaign_forms');
    expect(url).toMatch(/\?[^\s]*select=/);
    fetchSpy.mockRestore();
  });
});
