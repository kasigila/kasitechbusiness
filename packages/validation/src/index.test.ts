import { describe, expect, it } from "vitest";
import { notFound, ok, platformError } from "./index";

describe("platform errors", () => {
  it("uses NOT_FOUND for private resource misses", () => {
    expect(notFound().code).toBe("NOT_FOUND");
  });

  it("wraps success results", () => {
    expect(ok({ id: "1" })).toEqual({ ok: true, data: { id: "1" } });
  });

  it("creates typed platform errors", () => {
    expect(platformError("RATE_LIMITED", "Slow down").code).toBe(
      "RATE_LIMITED",
    );
  });
});
