import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { adminGuard } from '@/lib/auth';
import { photos } from '@/lib/store';
import { log } from '@/lib/log';

// الحذف هنا نقل للمحذوفات بس. الحذف النهائي في /api/admin/trash/photos/[id]
export async function DELETE(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  if (!/^[a-f0-9]{16}$/.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let found = false;
  await photos.mutate((list) => list.map((p) => {
    if (p.id !== id || p.deletedAt) return p;
    found = true;
    return { ...p, deletedAt: new Date().toISOString() };
  }));
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  log('info', 'photo_trashed', { id });
  await audit(user, 'photo.trash');
  return NextResponse.json({ ok: true });
}
