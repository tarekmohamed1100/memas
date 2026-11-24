import { NextResponse } from 'next/server';
import { adminGuard, requireOwner } from '@/lib/auth';
import { setUserStatus } from '@/lib/users';
import { audit } from '@/lib/audit';

export async function POST(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.disabled !== 'boolean') return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  if (!(await setUserStatus(id, body.disabled))) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'user.status', { id, disabled: body.disabled });
  return NextResponse.json({ ok: true });
}
