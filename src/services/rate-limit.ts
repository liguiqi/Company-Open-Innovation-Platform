import { RateLimiterMemory } from 'rate-limiter-flexible'

export const phoneSendLimiter = new RateLimiterMemory({
  duration: 60,
  points: 1,
})

export const emailSendLimiter = new RateLimiterMemory({
  duration: 60,
  points: 1,
})

export const ipSendLimiter = new RateLimiterMemory({
  duration: 60 * 60,
  points: 20,
})
