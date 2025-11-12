import type { H3Event } from 'h3'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  keyGenerator?: (event: H3Event) => string
}

export function rateLimit(options: RateLimitOptions) {
  const {
    maxRequests,
    windowMs,
    skipSuccessfulRequests = false,
    keyGenerator = (event) => getRequestIP(event) || 'unknown',
  } = options

  return async (event: H3Event) => {
    const key = keyGenerator(event)
    const now = Date.now()

    // Initialize or get existing rate limit data
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + windowMs,
      }
    }

    const rateLimitData = rateLimitStore[key]

    // Check if rate limit exceeded
    if (rateLimitData.count >= maxRequests) {
      const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000)

      throw createError({
        statusCode: 429,
        message: 'Too many requests, please try again later.',
        data: {
          retryAfter,
          limit: maxRequests,
          windowMs,
        },
      })
    }

    // Increment request count
    rateLimitData.count++

    // Set rate limit headers
    event.node.res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    event.node.res.setHeader(
      'X-RateLimit-Remaining',
      (maxRequests - rateLimitData.count).toString()
    )
    event.node.res.setHeader(
      'X-RateLimit-Reset',
      new Date(rateLimitData.resetTime).toISOString()
    )

    // If we should skip successful requests, decrement on successful response
    if (skipSuccessfulRequests) {
      event.node.res.on('finish', () => {
        if (event.node.res.statusCode < 400) {
          rateLimitData.count--
        }
      })
    }
  }
}

// Helper to get client IP
function getRequestIP(event: H3Event): string | undefined {
  const headers = event.node.req.headers

  // Check various headers that might contain the real IP
  const xForwardedFor = headers['x-forwarded-for']
  const xRealIp = headers['x-real-ip']
  const cfConnectingIp = headers['cf-connecting-ip'] // Cloudflare

  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp
  }

  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp
  }

  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor
    return ips.split(',')[0].trim()
  }

  return event.node.req.socket.remoteAddress
}
