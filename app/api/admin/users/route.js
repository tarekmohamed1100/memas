import { NextResponse } from 'next/server';
import { adminGuard, requireOwner } from '@/lib/auth';
import { listUsers, validateNewUser, createUser } from '@/lib/users';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;
  return NextResponse.json(await listUsers());
}

export async function POST(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const input = {
    name: String(body.name || '').trim(),
    username: String(body.username || '').trim().toLowerCase(),
    password: String(body.password || ''),
  };
  const err = validateNewUser(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const r = await createUser(input);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 409 });
  await audit(user, 'user.create', { username: input.username });
  return NextResponse.json(r.user, { status: 201 });
}
