import { NextResponse, type NextRequest } from 'next/server'

const protectedPrefixes = ['/dashboard']
const adminPrefixes = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const isDashboard = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  const isAdmin = adminPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (!isDashboard && !isAdmin) {
    return NextResponse.next()
  }

  const token = request.cookies.get('innovation-session')?.value

  if (!token) {
    if (isAdmin) {
      return NextResponse.next()
    }

    const loginURL = new URL('/login', request.url)
    loginURL.searchParams.set('redirect', `${pathname}${search}`)
    return NextResponse.redirect(loginURL)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
