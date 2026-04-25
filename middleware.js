import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/bible-verses-about-')) {
    if (!pathname.endsWith('/')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname + '/';
      return NextResponse.redirect(url, { status: 301 });
    }
    const remainder = pathname.slice('/bible-verses-about-'.length);
    const parts = remainder.split('/').filter(Boolean);
    const internalPath = '/bible-verses/' + parts.join('/') + '/';
    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }

  if (!pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname + '/';
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
