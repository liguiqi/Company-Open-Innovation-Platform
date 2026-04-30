import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { getPayloadClient } from './payload'

const LAST_ACCESS_THROTTLE_MS = 5 * 60 * 1000

type PayloadClientLike = PayloadRequest['payload'] | Awaited<ReturnType<typeof getPayloadClient>>
type UserAccessSource = number | Pick<User, 'id' | 'lastAccessAt'>

function parseAccessTime(value: unknown) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

export async function touchUserLastAccess(
  userOrId: UserAccessSource,
  options?: {
    force?: boolean
    now?: Date
    payload?: PayloadClientLike
  },
) {
  const userId = typeof userOrId === 'number' ? userOrId : Number(userOrId.id)

  if (!Number.isFinite(userId) || userId <= 0) {
    return null
  }

  const now = options?.now ?? new Date()
  const previousAccessAt =
    typeof userOrId === 'number' ? null : parseAccessTime(userOrId.lastAccessAt)

  if (
    !options?.force &&
    previousAccessAt &&
    now.getTime() - previousAccessAt.getTime() < LAST_ACCESS_THROTTLE_MS
  ) {
    return null
  }

  try {
    const payload = options?.payload ?? (await getPayloadClient())

    return (await payload.update({
      id: userId,
      collection: 'users',
      data: {
        lastAccessAt: now.toISOString(),
      },
      depth: 0,
      overrideAccess: true,
    })) as User
  } catch (error) {
    console.error('[user-access:touch-failed]', { error, userId })
    return null
  }
}
