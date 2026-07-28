import { describe, expect, it } from "vitest";
import {
  generateInvitationToken,
  hashInvitationToken,
  isForbiddenPublicAuthPath,
  isInvitationExpired,
} from "./index";

describe("public auth policy", () => {
  it("blocks signup-style routes", () => {
    expect(isForbiddenPublicAuthPath("/signup")).toBe(true);
    expect(isForbiddenPublicAuthPath("/register")).toBe(true);
    expect(isForbiddenPublicAuthPath("/create-account")).toBe(true);
    expect(isForbiddenPublicAuthPath("/login")).toBe(false);
  });
});

describe("invitation tokens", () => {
  it("hashes tokens for storage", () => {
    const { token, tokenHash } = generateInvitationToken();
    expect(tokenHash).toBe(hashInvitationToken(token));
    expect(tokenHash).not.toBe(token);
  });

  it("detects expiry", () => {
    expect(isInvitationExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isInvitationExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});
