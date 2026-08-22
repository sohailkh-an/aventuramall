import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getAdminSubdomainRewritePath } from './lib/admin-subdomain-routing';

export function proxy(request: NextRequest) {
  const rewritePath = getAdminSubdomainRewritePath(
    request.headers.get('host'),
    request.nextUrl.pathname
  );

  if (!rewritePath) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
