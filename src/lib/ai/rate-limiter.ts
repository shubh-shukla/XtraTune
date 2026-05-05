export interface BucketConfig {
  capacity: number;
  refillPerSec: number;
}

export function createBucket({ capacity, refillPerSec }: BucketConfig) {
  let tokens = capacity;
  let lastRefill = Date.now();

  const refill = () => {
    const now = Date.now();
    const delta = ((now - lastRefill) / 1000) * refillPerSec;
    tokens = Math.min(capacity, tokens + delta);
    lastRefill = now;
  };

  return {
    async tryAcquire(): Promise<boolean> {
      refill();
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    },
  };
}

// Process-wide bucket: 12 RPM (Gemini free tier is 15)
export const geminiBucket = createBucket({ capacity: 12, refillPerSec: 12 / 60 });
