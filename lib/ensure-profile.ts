import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULTS = {
  daily_calorie_target: 2000,
  protein_target: 150,
  carbs_target: 200,
  fat_target: 65,
  activity_level: 'moderate',
  goal: 'lose',
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Ensure auth.users has a matching profiles row (meal_logs FK requires it). */
export async function ensureProfile(supabase: SupabaseClient, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (existing?.id) return { ok: true };

  const row = { id: userId, ...DEFAULTS };
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (!error) return { ok: true };

  // RLS may block insert — retry with service role when available.
  const admin = serviceClient();
  if (admin) {
    const { error: adminError } = await admin.from('profiles').upsert(row, { onConflict: 'id' });
    if (!adminError) return { ok: true };
    return { ok: false, error: adminError.message };
  }

  return { ok: false, error: error.message };
}
