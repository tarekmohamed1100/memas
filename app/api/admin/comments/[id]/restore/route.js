import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { adminGuard } from '@/lib/auth';
import { comments } from '@/lib/store';

export async function POST(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  let found = false;
  await comments.mutate((list) => list.map((c) => {
    if (c.id !== id || !c.deletedAt) return c;
    found = true;
    return { ...c, deletedAt: undefined };
  }));
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'comment.restore');
  return NextResponse.json({ ok: true });
}
