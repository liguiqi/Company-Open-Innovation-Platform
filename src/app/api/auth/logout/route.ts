import { NextResponse } from 'next/server'

import { createExpiredAuthCookie } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.headers.append('Set-Cookie', await createExpiredAuthCookie())
  return response
}
