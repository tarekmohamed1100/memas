import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { config, configOk } from './config';
import { OWNER_ID, ownerUser, findById, publicUser } from './users';

export const COOKIE_NAME = 'lm_session';
const TTL_MS = 12 * 60 * 60 * 1000;
export const cookieOpts = { httpOnly: true, sameSite: 'strict', secure: config.isProd, path: '/', maxAge: TTL_MS / 1000 };

const sign = (v) => crypto.createHmac('sha256', config.sessionSecret).update(v).digest('base64url');

export function makeToken(uid) {
  const now = Date.now();
  const body = Buffer.from(JSON.stringify({ uid, iat: now, exp: now + TTL_MS })).toString('base64url');
  return `${body}.${sign(body)}`;
}
function readToken(t) {
  if (!t || !configOk()) return null;
  const [body, sig] = String(t).split('.');
  if (!body || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(sign(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

export function passwordOk(p) {
  const d = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(d(p), d(config.adminPassword));
}

// المستخدم الحالي، أو null لو مفيش جلسة أو الحساب اتعطّل
export async function currentUser() {
  const p = readToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!p) return null;
  if (p.uid === OWNER_ID) return ownerUser();
  const u = await findById(p.uid);
  if (!u || u.disabled) return null;
  // الجلسات اللي اتعملت قبل آخر تغيير لكلمة السر بتتقفل
  if (u.passwordChangedAt && p.iat < Date.parse(u.passwordChangedAt)) return null;
  return publicUser(u);
}

// حارس لكل روابط الأدمن: الجلسة + هيدر CSRF للطلبات اللي بتغيّر حاجة
export async function adminGuard(request) {
  if (!configOk()) return { denied: NextResponse.json({ error: 'server_misconfigured' }, { status: 500 }) };
  const user = await currentUser();
  if (!user) return { denied: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  if (request.method !== 'GET' && request.headers.get('x-requested-with') !== 'admin')
    return { denied: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { user };
}

// الصلاحيات اللي للمالك بس
export function requireOwner(user) {
  return user.role === 'owner' ? null : NextResponse.json({ error: 'forbidden_role' }, { status: 403 });
}
