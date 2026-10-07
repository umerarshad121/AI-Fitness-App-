import { NextResponse } from 'next/server';
import { ensureProfile } from '../../../lib/ensure-profile';
import { createClient } from '../../../lib/supabase/server';

export async function GET() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { data, error } = await s.from('grocery_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const profile = await ensureProfile(s, user.id);
  if (!profile.ok) return NextResponse.json({ error: `Profile setup failed: ${profile.error}` }, { status: 400 });
  const body = await request.json();
  const { data, error } = await s.from('grocery_items').insert({ user_id: user.id, name: body.name, quantity: body.quantity ?? null }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data, { status: 201 });
}
