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

export const codeVerifyLimiter = new RateLimiterMemory({
  duration: 60 * 10,
  points: 5,
})

export const ipVerifyLimiter = new RateLimiterMemory({
  duration: 60 * 10,
  points: 25,
})

export const loginIpLimiter = new RateLimiterMemory({
  duration: 60 * 15,
  points: 10,
})

export const loginAccountLimiter = new RateLimiterMemory({
  duration: 60 * 15,
  points: 5,
})
