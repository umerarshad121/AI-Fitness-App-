import { NextResponse } from 'next/server';
import { ensureProfile } from '../../../lib/ensure-profile';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const profile = await ensureProfile(supabase, user.id);
  if (!profile.ok) return NextResponse.json({ error: `Profile setup failed: ${profile.error}` }, { status: 400 });
  const body = await request.json();
  const { data, error } = await supabase.from('exercises').insert({
    user_id: user.id,
    name: body.name,
    minutes: Number(body.minutes) || 0,
    calories_burned: Number(body.calories_burned) || 0,
    performed_at: body.performed_at ?? new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const days = Math.min(30, Math.max(1, Number(new URL(request.url).searchParams.get('days') ?? 1)));
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const { data, error } = await supabase
    .from('exercises')
    .select('name,minutes,calories_burned,performed_at')
    .eq('user_id', user.id)
    .gte('performed_at', since.toISOString())
    .order('performed_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}
