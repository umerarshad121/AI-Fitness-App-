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
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/profile') || request.nextUrl.pathname.startsWith('/diary') || request.nextUrl.pathname.startsWith('/watch') || request.nextUrl.pathname.startsWith('/tracking') || request.nextUrl.pathname.startsWith('/planner') || request.nextUrl.pathname.startsWith('/progress') || request.nextUrl.pathname.startsWith('/weight');
    if (!user && isProtectedRoute) return NextResponse.redirect(new URL('/auth', request.url));
  } catch {
    // Supabase outages/configuration errors should not break the public landing page.
    return NextResponse.next();
  }
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/profile/:path*', '/diary/:path*', '/watch/:path*', '/tracking/:path*', '/planner/:path*', '/progress/:path*', '/weight/:path*'] };
