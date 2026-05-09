import { NextResponse, type NextRequest } from 'next/server'

const protectedPrefixes = ['/dashboard']
const adminPrefixes = ['/admin']
const adminApiPrefixes = ['/api/graphql', '/api/access', '/api/globals']

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const isDashboard = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  const isAdmin = adminPrefixes.some((prefix) => pathname.startsWith(prefix))
  const isAdminApi = adminApiPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (!isDashboard && !isAdmin && !isAdminApi) {
    return NextResponse.next()
  }

  const token = request.cookies.get('innovation-session')?.value

  if (!token) {
    if (isAdmin) {
      const loginURL = new URL('/login', request.url)
      loginURL.searchParams.set('redirect', `${pathname}${search}`)
      return NextResponse.redirect(loginURL)
    }

    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const loginURL = new URL('/login', request.url)
    loginURL.searchParams.set('redirect', `${pathname}${search}`)
    return NextResponse.redirect(loginURL)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/graphql',
    '/api/access',
    '/api/globals',
    '/api/globals/:path*',
  ],
}
