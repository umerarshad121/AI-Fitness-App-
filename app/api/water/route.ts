import { NextResponse } from 'next/server';
import { ensureProfile } from '../../../lib/ensure-profile';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const profile = await ensureProfile(s, user.id);
  if (!profile.ok) return NextResponse.json({ error: `Profile setup failed: ${profile.error}` }, { status: 400 });
  const body = await request.json();
  const { data, error } = await s.from('water_logs').insert({ user_id: user.id, amount_ml: body.amount_ml }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data, { status: 201 });
}
