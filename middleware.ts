import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Do not let a missing Vercel environment variable turn every page into a 500.
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    const isProtectedRoute = ['/dashboard', '/profile', '/diary', '/watch', '/tracking', '/planner', '/progress', '/weight', '/scan'].some(path => request.nextUrl.pathname.startsWith(path));
    if (!user && isProtectedRoute) return NextResponse.redirect(new URL('/auth', request.url));
  } catch {
    // Supabase outages/configuration errors should not break the public landing page.
    return NextResponse.next();
  }
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/profile/:path*', '/diary/:path*', '/watch/:path*', '/tracking/:path*', '/planner/:path*', '/progress/:path*', '/weight/:path*', '/scan/:path*'] };
