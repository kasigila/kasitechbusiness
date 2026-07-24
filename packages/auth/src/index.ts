import { createHash, randomBytes } from "node:crypto";

export {
  FORBIDDEN_PUBLIC_AUTH_ROUTES,
  PUBLIC_AUTH_ROUTES,
  isForbiddenPublicAuthPath,
} from "./policy";

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInvitationToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function isInvitationExpired(
  expiresAt: Date | string,
  now = new Date(),
): boolean {
  const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return exp.getTime() <= now.getTime();
}
