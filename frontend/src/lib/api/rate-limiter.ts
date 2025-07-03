export class RateLimiter {
  private requests = new Map<string, number[]>()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isLimited(key: string): boolean {
    const now = Date.now()
    const timestamps = this.requests.get(key) || []

    // Remove timestamps antigos
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    )

    if (validTimestamps.length >= this.maxRequests) {
      return true
    }

    validTimestamps.push(now)
    this.requests.set(key, validTimestamps)
    return false
  }

  clear(): void {
    this.requests.clear()
  }
}
