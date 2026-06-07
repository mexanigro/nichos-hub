import { timingSafeEqual } from "crypto";

export function safeCompare(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
