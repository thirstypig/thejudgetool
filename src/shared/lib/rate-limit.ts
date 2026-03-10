/**
 * Simple in-memory sliding-window rate limiter.
 * No external dependencies — uses a Map with TTL cleanup.
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

const store = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** Clean up expired entries periodically */
function cleanup() {
  const now = Date.now();
  const keys = Array.from(store.keys());
  for (const key of keys) {
    const entry = store.get(key);
    if (entry && now - entry.firstAttempt > WINDOW_MS) {
      store.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 5 * 60 * 1000).unref?.();
}

/**
 * Check rate limit for a given key (e.g., "judge:100001" or "organizer:email@test.com").
 * Throws if the limit is exceeded.
 */
export function checkRateLimit(key: string): void {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    // First attempt or window expired — reset
    store.set(key, { attempts: 1, firstAttempt: now });
    return;
  }

  entry.attempts++;

  if (entry.attempts > MAX_ATTEMPTS) {
    const remainingMs = WINDOW_MS - (now - entry.firstAttempt);
    const remainingMin = Math.ceil(remainingMs / 60_000);
    throw new Error(
      `Too many login attempts. Try again in ${remainingMin} minute${remainingMin === 1 ? "" : "s"}.`
    );
  }
}

/**
 * Reset the rate limit for a key (call on successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
