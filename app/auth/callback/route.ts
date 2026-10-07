import { NextResponse } from 'next/server';
import { ensureProfile } from '../../../lib/ensure-profile';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const supabase = await createClient();
  if (code) await supabase.auth.exchangeCodeForSession(code);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await ensureProfile(supabase, user.id);
  return NextResponse.redirect(new URL('/dashboard', url.origin));
}
