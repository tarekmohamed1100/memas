import { NextResponse } from 'next/server';
import { adminGuard, makeToken, COOKIE_NAME, cookieOpts } from '@/lib/auth';
import { findById, verifyPassword, setUserPassword, validatePassword } from '@/lib/users';
import { audit } from '@/lib/audit';

// المحرر بيغيّر كلمة سره بنفسه. كلمة سر المالك من ADMIN_PASSWORD بس
export async function POST(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  if (user.role === 'owner') return NextResponse.json({ error: 'owner_env' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const current = String(body.current || '');
  const next = String(body.next || '');
  const err = validatePassword(next);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  if (next === current) return NextResponse.json({ error: 'same_password' }, { status: 400 });

  const u = await findById(user.id);
  if (!u || u.disabled || !verifyPassword(current, u.passwordHash))
    return NextResponse.json({ error: 'wrong_current' }, { status: 401 });

  await setUserPassword(user.id, next);
  await audit(user, 'user.password', { self: true });
  // الجلسة الحالية بتفضل شغالة، والجلسات التانية بتتقفل
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(user.id), cookieOpts);
  return res;
}
