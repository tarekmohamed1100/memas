import { config } from './config';
import { limits } from './store';

// بيعد المحاولات في القاعدة عشان يشتغل مع كل النسخ
export async function overLimit(key, max, windowMs) {
  const now = Date.now();
  let over = false;
  await limits.mutate((list) => {
    const live = list.filter((e) => e.reset > now);
    let e = live.find((x) => x.key === key);
    if (!e) { e = { key, n: 0, reset: now + windowMs }; live.push(e); }
    e.n += 1;
    over = e.n > max;
    return live;
  });
  return over;
}

export async function clearLimit(key) {
  await limits.mutate((list) => list.filter((e) => e.key !== key));
}

export function clientIp(request) {
  const fwd = config.trustProxy ? request.headers.get('x-forwarded-for') : null;
  return (fwd && fwd.split(',')[0].trim()) || 'direct';
}
