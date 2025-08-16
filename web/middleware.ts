import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Easypay return callback (POST) is sent to page route; rewrite to API handler then redirect back as GET with status
  if (pathname.startsWith('/payments/easypay/return') && req.method === 'POST') {
    try {
      const apiUrl = req.nextUrl.clone();
      apiUrl.pathname = '/api/payments/easypay/return';
      // strip search to avoid malformed bodies being interpreted as URL query
      apiUrl.search = '';
      return NextResponse.rewrite(apiUrl);
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = '/api/payments/easypay/return';
      url.search = '';
      return NextResponse.rewrite(url);
    }
  }
  // Some gateways may POST back to /cart on cancel/close in local envs. Convert to safe GET redirect.
  if (pathname === '/cart' && req.method === 'POST') {
    const url = req.nextUrl.clone();
    url.searchParams.set('cancelled', '1');
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/payments/easypay/return', '/payments/easypay/return/:path*', '/cart'],
};


