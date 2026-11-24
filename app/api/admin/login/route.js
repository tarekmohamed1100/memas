import { NextResponse } from 'next/server';
import { configOk } from '@/lib/config';
import { COOKIE_NAME, cookieOpts, makeToken, passwordOk } from '@/lib/auth';
import { ownerUser, findByUsername, verifyPassword, publicUser, touchLogin } from '@/lib/users';
import { overLimit, clearLimit, clientIp } from '@/lib/ratelimit';
import { audit } from '@/lib/audit';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!configOk()) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  const key = `login:${clientIp(request)}`;
  if (await overLimit(key, 5, 15 * 60 * 1000)) return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const pw = typeof body?.password === 'string' ? body.password : '';

  let user = null;
  if (username === 'owner' && pw && passwordOk(pw)) {
    user = ownerUser();
  } else if (username && pw) {
    const u = await findByUsername(username);
    if (u && !u.disabled && verifyPassword(pw, u.passwordHash)) {
      user = publicUser(u);
      await touchLogin(u.id);
    }
  }
  if (!user) {
    log('warn', 'login_failed');
    return NextResponse.json({ error: 'bad_credentials' }, { status: 401 });
  }
  await clearLimit(key);
  await audit(user, 'login');
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(COOKIE_NAME, makeToken(user.id), cookieOpts);
  return res;
}
