import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createHash, timingSafeEqual } from 'crypto'

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : undefined

export const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 s') }) : undefined

export async function rateLimit(ip: string, key: string) {
  if (!limiter) return { success: true }
  return limiter.limit(`rl:${ip}:${key}`)
}

export function verifySharedSecretSignature(rawBody: string, header: string | null, secretEnvVar: string) {
  if (!header) return false
  const secret = process.env[secretEnvVar]
  if (!secret) return false
  const hmac = createHash('sha256').update(rawBody + secret).digest('hex')
  const received = header.replace(/sha256=/, '')
  const a = Buffer.from(hmac, 'hex')
  const b = Buffer.from(received, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

