import { config } from './config';

const hits = (globalThis.__memasHits ??= new Map());

export function overLimit(key, max, windowMs) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  let e = hits.get(key);
  if (!e || e.reset < now) { e = { n: 0, reset: now + windowMs }; hits.set(key, e); }
  e.n += 1;
  return e.n > max;
}
export const clearLimit = (key) => hits.delete(key);

export function clientIp(request) {
  const fwd = config.trustProxy ? request.headers.get('x-forwarded-for') : null;
  return (fwd && fwd.split(',')[0].trim()) || 'direct';
}
