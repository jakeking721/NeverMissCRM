import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'TEST_OWNER_EMAIL',
  'TEST_OWNER_PASSWORD',
  'TEST_OTHER_EMAIL',
  'TEST_OTHER_PASSWORD',
  'TEST_CAMPAIGN_SLUG',
];

const missingEnv = requiredEnv.filter((k) => !process.env[k]);

// Skip tests if env isn't configured
if (missingEnv.length) {
  describe.skip(`supabase RLS smoke tests`, () => {
    it('skipped due to missing env vars', () => {
      console.warn('Missing env vars for Supabase tests:', missingEnv.join(', '));
    });
  });
} else {
  const url = process.env.SUPABASE_URL!;
  const anonKey = process.env.SUPABASE_ANON_KEY!;
  const slug = process.env.TEST_CAMPAIGN_SLUG!;

  const anon = createClient(url, anonKey);
  const owner: SupabaseClient = createClient(url, anonKey);
  const other: SupabaseClient = createClient(url, anonKey);

  let intake: any;
  let customerId: string;

  beforeAll(async () => {
    await owner.auth.signInWithPassword({
      email: process.env.TEST_OWNER_EMAIL!,
      password: process.env.TEST_OWNER_PASSWORD!,
    });
    await other.auth.signInWithPassword({
      email: process.env.TEST_OTHER_EMAIL!,
      password: process.env.TEST_OTHER_PASSWORD!,
    });
    const { data, error } = await anon
      .from('intake_resolver')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    intake = data;
  });

  afterAll(async () => {
    await owner.auth.signOut();
    await other.auth.signOut();
    if (customerId) {
      await owner.from('customer_latest_values').delete().eq('customer_id', customerId);
      await owner.from('intake_submissions').delete().eq('customer_id', customerId);
      await owner.from('customers').delete().eq('id', customerId);
    }
  });

  describe('public intake submit flow', () => {
    it('creates submission, customer, and latest values via RPC', async () => {
      const email = `test-${uuidv4()}@example.com`;
      const phone = `+1555${Math.floor(Math.random() * 1_000_0000)
        .toString()
        .padStart(7, '0')}`;
      const answers = {
        'f.first_name': 'Rls',
        'f.last_name': 'Test',
        'f.email': email,
        'f.phone': phone,
        'f.zip_code': '30301',
      };
      const { data: custId, error } = await anon.rpc('intake_submit', {
        p_user_id: intake.user_id,
        p_form_id: intake.form_id,
        p_campaign_id: intake.campaign_id,
        p_answers: answers,
        p_consent_text: 'yes',
      });
      expect(error).toBeNull();
      customerId = custId as string;

      const { data: sub } = await owner
        .from('intake_submissions')
        .select('customer_id, consent_text')
        .eq('customer_id', customerId)
        .single();
      expect(sub?.consent_text).toBe('yes');

      const { data: customer } = await owner
        .from('customers')
        .select('id, first_name, phone, consent_text, consent_collected_at')
        .eq('id', customerId)
        .single();
      expect(customer?.first_name).toBe('Rls');
      expect(customer?.consent_text).toBe('yes');
      expect(customer?.consent_collected_at).not.toBeNull();

      const { data: latest } = await owner
        .from('customer_latest_values')
        .select('data_key')
        .eq('customer_id', customerId);
      const keys = (latest ?? []).map((r: any) => r.data_key);
      expect(keys).toContain('f.first_name');
      expect(keys).toContain('f.phone');
    });
  });

  describe('owner read checks', () => {
    it('owner can read key tables', async () => {
      for (const table of [
        'campaign_forms',
        'intake_submissions',
        'customers',
        'customer_latest_values',
      ]) {
        const { error } = await owner.from(table).select('*').limit(1);
        expect(error).toBeNull();
      }
    });

    it('other user cannot read owner rows', async () => {
      const { data: formRows } = await other
        .from('campaign_forms')
        .select('*')
        .eq('id', intake.form_id);
      expect(formRows ?? []).toHaveLength(0);

      const { data: subRows } = await other
        .from('intake_submissions')
        .select('*')
        .eq('customer_id', customerId);
      expect(subRows ?? []).toHaveLength(0);

      const { data: custRows } = await other
        .from('customers')
        .select('*')
        .eq('id', customerId);
      expect(custRows ?? []).toHaveLength(0);

      const { data: latestRows } = await other
        .from('customer_latest_values')
        .select('*')
        .eq('customer_id', customerId);
      expect(latestRows ?? []).toHaveLength(0);
    });
  });

  describe('public read-only enforcement', () => {
    it('allows anon reads on intake_resolver, campaign_forms via slug, and public_slugs', async () => {
      expect(
        (await anon.from('intake_resolver').select('*').eq('slug', slug)).error,
      ).toBeNull();
      expect(
        (await anon.from('campaign_forms').select('*').eq('slug', slug)).error,
      ).toBeNull();
      expect((await anon.from('public_slugs').select('*').eq('slug', slug)).error).toBeNull();
    });

    it('denies anon access to protected tables and writes', async () => {
      for (const table of ['customers', 'intake_submissions', 'campaigns']) {
        const { error } = await anon.from(table).select('*').limit(1);
        expect(error).toBeTruthy();
      }
      const insert = await anon
        .from('intake_submissions')
        .insert({})
        .select();
      expect(insert.error).toBeTruthy();
    });
  });

  describe('regression guards', () => {
    it('direct insert into intake_submissions is blocked even for owner', async () => {
      const res = await owner
        .from('intake_submissions')
        .insert({ user_id: intake.user_id })
        .select();
      expect(res.error).toBeTruthy();
    });

    it('campaign_forms has no owner_id column', async () => {
      const { error } = await owner
        .from('campaign_forms')
        .select('owner_id')
        .limit(1);
      expect(error).toBeTruthy();
    });
  });
}
