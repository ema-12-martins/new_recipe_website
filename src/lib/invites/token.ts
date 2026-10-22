import { createHash, randomBytes } from "node:crypto";

/** 32 random bytes as base64url: 43 URL-safe characters, 256 bits of entropy. */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** The only form in which a token is stored: SHA-256, hex encoded. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isInviteTokenFormat(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}
