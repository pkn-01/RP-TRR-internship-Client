import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Check if this is a LINE OAuth callback
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const liffClientId = searchParams.get('liffClientId');
  const liffRedirectUri = searchParams.get('liffRedirectUri');

  console.log('Root GET handler - checking for LINE callback:', {
    code: !!code,
    state: !!state,
    liffClientId: !!liffClientId,
  });

  if (liffClientId || liffRedirectUri) {
    console.log('LIFF request detected at root');
    
    // Check for deep link in liff.state
    const liffState = searchParams.get('liff.state');
    let targetPath = '/repairs/liff';
    
    if (liffState) {
      // Ensure the path starts with a slash
      const normalizedPath = liffState.startsWith('/') ? liffState : `/${liffState}`;
      // Basic validation to ensure it's a relative path in our app
      if (normalizedPath.startsWith('/repairs')) {
        targetPath = normalizedPath;
        console.log('LIFF deep link detected and normalized:', targetPath);
      }
    }
    
    const targetUrl = new URL(targetPath, request.nextUrl.origin);
    // Append all original search params to the target URL
    searchParams.forEach((value, key) => {
      if (key !== 'liff.state') { // Avoid duplicating state if we used it for the path
        targetUrl.searchParams.append(key, value);
      }
    });

    console.log('Redirecting LIFF root request to:', targetUrl.toString());
    return NextResponse.redirect(targetUrl.toString());
  }

  if (code) {
    const baseUrl = request.nextUrl.origin;
    const callbackUrl = new URL('/callback', baseUrl);
    if (code) callbackUrl.searchParams.append('code', code);
    if (state) callbackUrl.searchParams.append('state', state);
    return NextResponse.redirect(callbackUrl.toString());
  }

  // Check if this is from a LINE browser/app
  const userAgent = request.headers.get('user-agent') || '';
  const isLine = /Line/i.test(userAgent);

  if (isLine && !code && !liffClientId && !liffRedirectUri) {
    console.log('LINE User detected at root, redirecting to reporter portal');
    return NextResponse.redirect(new URL('/repairs/liff', request.nextUrl.origin));
  }

  // Not a callback, redirect to login
  console.log('Not a LINE callback or app, redirecting to login');
  return NextResponse.redirect(new URL('/login/admin', request.nextUrl.origin));
}
