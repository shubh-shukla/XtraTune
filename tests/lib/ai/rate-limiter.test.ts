import { describe, it, expect } from "vitest";
import { createBucket } from "@/lib/ai/rate-limiter";

describe("token bucket", () => {
  it("allows up to capacity then rejects", async () => {
    const bucket = createBucket({ capacity: 3, refillPerSec: 0 });
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(false);
  });

  it("refills tokens over time", async () => {
    const bucket = createBucket({ capacity: 1, refillPerSec: 1000 });
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(false);
    await new Promise((r) => setTimeout(r, 10));
    expect(await bucket.tryAcquire()).toBe(true);
  });
});
