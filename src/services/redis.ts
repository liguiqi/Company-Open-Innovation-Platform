import Redis from 'ioredis'

import { appEnv } from '@/lib/env'

const memoryStore = new Map<string, { expiresAt: number; value: string }>()

let redisClient: Redis | null = null

function getRedisClient() {
  if (!appEnv.REDIS_URL) {
    return null
  }

  if (!redisClient) {
    redisClient = new Redis(appEnv.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })
  }

  return redisClient
}

export async function setCachedValue(key: string, value: string, ttlSeconds: number) {
  const redis = getRedisClient()

  if (redis) {
    await redis.connect().catch(() => undefined)
    await redis.set(key, value, 'EX', ttlSeconds)
    return
  }

  memoryStore.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value,
  })
}

export async function getCachedValue(key: string) {
  const redis = getRedisClient()

  if (redis) {
    await redis.connect().catch(() => undefined)
    return redis.get(key)
  }

  const item = memoryStore.get(key)

  if (!item) {
    return null
  }

  if (item.expiresAt <= Date.now()) {
    memoryStore.delete(key)
    return null
  }

  return item.value
}

export async function deleteCachedValue(key: string) {
  const redis = getRedisClient()

  if (redis) {
    await redis.connect().catch(() => undefined)
    await redis.del(key)
    return
  }

  memoryStore.delete(key)
}
