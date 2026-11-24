import { NextResponse } from 'next/server';
import { adminGuard, requireOwner } from '@/lib/auth';
import { setUserPassword, validatePassword } from '@/lib/users';
import { audit } from '@/lib/audit';

export async function POST(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const password = String(body.password || '');
  const err = validatePassword(password);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  if (!(await setUserPassword(id, password))) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'user.password', { id });
  return NextResponse.json({ ok: true });
}
