import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { appEnv } from './env'
import { getPayloadClient } from './payload'

const AUTH_COOKIE_NAME = 'innovation-session'
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8

async function signSession(user: Pick<User, 'email' | 'id' | 'name' | 'role'>) {
  return new SignJWT({
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_COOKIE_MAX_AGE}s`)
    .sign(new TextEncoder().encode(appEnv.PAYLOAD_SECRET))
}

async function verifySession(token?: string | null) {
  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(appEnv.PAYLOAD_SECRET))
    return payload as { id: number; role: User['role'] }
  } catch {
    return null
  }
}

function parseCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null
  }

  const match = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const session = await verifySession(token)

  if (!session) {
    return null
  }

  const payload = await getPayloadClient()
  return (await payload
    .findByID({
      id: Number(session.id),
      collection: 'users',
      overrideAccess: true,
    })
    .catch(() => null)) as User | null
}

export async function getRequestUser(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), AUTH_COOKIE_NAME)
  const session = await verifySession(token)

  if (!session) {
    return null
  }

  const payload = await getPayloadClient()
  return (await payload
    .findByID({
      id: Number(session.id),
      collection: 'users',
      overrideAccess: true,
    })
    .catch(() => null)) as User | null
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireRole(roles: User['role'][]) {
  const user = await requireUser()

  if (!roles.includes(user.role)) {
    redirect('/dashboard')
  }

  return user
}

export async function createAuthCookie(user: User) {
  const token = await signSession(user)
  const expiresAt = new Date(Date.now() + AUTH_COOKIE_MAX_AGE * 1000)

  return `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${appEnv.isProduction ? '; Secure' : ''}`
}

export async function createExpiredAuthCookie() {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(0).toUTCString()}${appEnv.isProduction ? '; Secure' : ''}`
}

export function getRequesterIP(req: Request | PayloadRequest) {
  if ('headers' in req && req.headers instanceof Headers) {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
  }

  return '0.0.0.0'
}
