import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabase.from('exercises').insert({ user_id: user.id, name: body.name, minutes: body.minutes, calories_burned: body.calories_burned, performed_at: body.performed_at ?? new Date().toISOString() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
