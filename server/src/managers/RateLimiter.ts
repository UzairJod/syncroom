/**
 * Token bucket rate limiter per socket ID.
 * Each socket gets a bucket of tokens that refills over time.
 * Each action consumes one token. If the bucket is empty, the action is denied.
 */
export class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private maxTokens: number;
  private refillRate: number;       // tokens to add per refill
  private refillIntervalMs: number; // milliseconds between refills

  /**
   * @param maxTokens Maximum tokens in the bucket
   * @param refillRate Number of tokens to add per refill interval
   * @param refillIntervalMs Milliseconds between refills
   */
  constructor(maxTokens: number, refillRate: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.refillIntervalMs = refillIntervalMs;
  }

  /**
   * Try to consume one token from the bucket for the given socket ID.
   * Returns true if the action is allowed, false if rate limited.
   */
  consume(socketId: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(socketId);

    if (!bucket) {
      // First time: create a full bucket
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(socketId, bucket);
      return true;
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs) * this.refillRate;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Try to consume
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }

    return false;
  }

  /** Remove a socket's bucket (call on disconnect) */
  cleanup(socketId: string): void {
    this.buckets.delete(socketId);
  }

  /** Clear all buckets */
  reset(): void {
    this.buckets.clear();
  }
}
