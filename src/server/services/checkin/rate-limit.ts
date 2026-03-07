type Bucket = {
  count: number;
  resetAt: number;
};

const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;
const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

export function isRateLimited(key: string) {
  const current = buckets.get(key);
  if (!current) return false;
  if (current.resetAt <= now()) {
    buckets.delete(key);
    return false;
  }
  return current.count >= MAX_ATTEMPTS;
}

export function registerAttempt(key: string, successful = false) {
  if (successful) {
    buckets.delete(key);
    return;
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now()) {
    buckets.set(key, { count: 1, resetAt: now() + ATTEMPT_WINDOW_MS });
    return;
  }

  existing.count += 1;
  buckets.set(key, existing);
}

