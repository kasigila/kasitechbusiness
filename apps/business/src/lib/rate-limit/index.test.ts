import { describe, expect, it, beforeEach } from "vitest";
import { rateLimit, resetRateLimitBuckets } from "./index";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimitBuckets());

  it("allows under the limit", () => {
    const a = rateLimit({ key: "login:1", limit: 3, windowMs: 60_000, now: 1000 });
    expect(a.allowed).toBe(true);
    expect(a.remaining).toBe(2);
  });

  it("blocks when exceeded", () => {
    const now = 1000;
    rateLimit({ key: "api:x", limit: 2, windowMs: 60_000, now });
    rateLimit({ key: "api:x", limit: 2, windowMs: 60_000, now });
    const blocked = rateLimit({ key: "api:x", limit: 2, windowMs: 60_000, now });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window", () => {
    rateLimit({ key: "w", limit: 1, windowMs: 1000, now: 0 });
    const blocked = rateLimit({ key: "w", limit: 1, windowMs: 1000, now: 500 });
    expect(blocked.allowed).toBe(false);
    const after = rateLimit({ key: "w", limit: 1, windowMs: 1000, now: 1001 });
    expect(after.allowed).toBe(true);
  });
});
