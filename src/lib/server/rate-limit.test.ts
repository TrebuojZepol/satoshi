import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  rateLimitPost,
  resetRateLimitBucketsForTests,
} from "./rate-limit";

function reqWithIp(ip: string): Request {
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimitPost", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitBucketsForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimitBucketsForTests();
  });

  it("allows up to MAX_POSTS_PER_WINDOW per minute per client", () => {
    const r = reqWithIp("203.0.113.9");
    for (let i = 0; i < 180; i += 1) {
      expect(rateLimitPost(r).ok).toBe(true);
    }
    expect(rateLimitPost(r).ok).toBe(false);
  });

  it("resets after window elapses", () => {
    const r = reqWithIp("198.51.100.2");
    for (let i = 0; i < 180; i += 1) {
      rateLimitPost(r);
    }
    expect(rateLimitPost(r).ok).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(rateLimitPost(r).ok).toBe(true);
  });

  it("tracks different clients separately", () => {
    const a = reqWithIp("198.51.100.10");
    const b = reqWithIp("198.51.100.11");
    for (let i = 0; i < 180; i += 1) {
      rateLimitPost(a);
    }
    expect(rateLimitPost(a).ok).toBe(false);
    expect(rateLimitPost(b).ok).toBe(true);
  });
});
