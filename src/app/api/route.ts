import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  // If this is a LINE OAuth callback, redirect to /callback
  if (searchParams.has('code')) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/callback';
    return NextResponse.redirect(callbackUrl);
  }

  return NextResponse.json({ message: 'API Root' }, { status: 200 });
}
