import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const protectedPaths = ['/dashboard']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  if (isProtected) {
    // Dev bypass to help preview when cookies are blocked by the IDE webview
    if (process.env.NODE_ENV !== 'production' && request.nextUrl.searchParams.get('dev') === '1') {
      return NextResponse.next()
    }
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Edge-compatible JWT verification using jose
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')
      await jwtVerify(token, secret, { algorithms: ['HS256'] })
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}