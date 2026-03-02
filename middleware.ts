import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

// Routes only accessible by MANAGER
const MANAGER_ONLY_ROUTES = ['/dashboard', '/products/add'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('slooze_token')?.value;
  const role = request.cookies.get('slooze_role')?.value;

  // Root path → redirect based on auth status
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    if (token) {
      url.pathname = role === 'STORE_KEEPER' ? '/products' : '/dashboard';
    } else {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  // Not authenticated → redirect to /login (unless already there)
  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated on /login → redirect to appropriate home
  if (token && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = role === 'STORE_KEEPER' ? '/products' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // STORE_KEEPER trying to access MANAGER-only routes
  if (token && role === 'STORE_KEEPER') {
    const isRestricted =
      MANAGER_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
      // Also block /products/[id]/edit
      /^\/products\/[^/]+\/edit/.test(pathname);

    if (isRestricted) {
      const url = request.nextUrl.clone();
      url.pathname = '/products';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next (static files, image optimization)
     * - favicon.ico
     * - public assets with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
