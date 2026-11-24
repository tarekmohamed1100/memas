import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { adminGuard, requireOwner } from '@/lib/auth';
import { comments } from '@/lib/store';

export async function DELETE(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const { id } = await params;
  let found = false;
  await comments.mutate((list) => {
    const next = list.filter((c) => !(c.id === id && c.deletedAt));
    found = next.length !== list.length;
    return next;
  });
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'comment.purge');
  return NextResponse.json({ ok: true });
}
