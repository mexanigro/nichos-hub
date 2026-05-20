/**
 * Simple in-memory rate limiter for public endpoints.
 * Tracks requests per IP with a sliding window.
 */

const windows = new Map<string, number[]>();

const CLEANUP_INTERVAL_MS = 5 * 60_000;
const MAX_STALE_MS = 10 * 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of windows) {
    const valid = timestamps.filter((t) => now - t < MAX_STALE_MS);
    if (valid.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, valid);
    }
  }
}

export function isRateLimited(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  cleanup();

  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const timestamps = windows.get(key) ?? [];

  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    return true;
  }

  valid.push(now);
  windows.set(key, valid);
  return false;
}
