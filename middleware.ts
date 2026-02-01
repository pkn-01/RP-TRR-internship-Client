import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Middleware is now minimal - route handlers will take care of routing
  return NextResponse.next();
}

export const config = {
  matcher: [ 
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|logo rptrr.png).*)',
  ],
};
