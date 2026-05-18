// Simple in-memory rate limiter for API routes.
// Not shared across serverless instances, but effective against single-origin bursts.
const stores = new Map();

export function createRateLimiter(key, maxRequests, windowMs) {
  if (!stores.has(key)) stores.set(key, new Map());
  const map = stores.get(key);

  return function isRateLimited(ip) {
    const now = Date.now();
    const entry = map.get(ip);
    if (!entry || now > entry.resetAt) {
      map.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }
    if (entry.count >= maxRequests) return true;
    entry.count += 1;
    return false;
  };
}

export function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
