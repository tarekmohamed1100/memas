import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { adminGuard } from '@/lib/auth';
import { comments } from '@/lib/store';

// الحذف هنا نقل للمحذوفات بس. الحذف النهائي في /api/admin/trash/comments/[id]
export async function DELETE(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  let found = false;
  await comments.mutate((list) => list.map((c) => {
    if (c.id !== id || c.deletedAt) return c;
    found = true;
    return { ...c, deletedAt: new Date().toISOString() };
  }));
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'comment.trash');
  return NextResponse.json({ ok: true });
}
