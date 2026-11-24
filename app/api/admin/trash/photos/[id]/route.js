import { NextResponse } from 'next/server';
import { adminGuard, requireOwner } from '@/lib/auth';
import { photos } from '@/lib/store';
import { removeImage } from '@/lib/files';
import { audit } from '@/lib/audit';
import { log } from '@/lib/log';

// حذف نهائي: بيشيل الصورة من القاعدة ومن التخزين، ومش هترجع تاني
export async function DELETE(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const { id } = await params;
  let removed = null;
  await photos.mutate((list) => {
    removed = list.find((p) => p.id === id && p.deletedAt) || null;
    return removed ? list.filter((p) => p.id !== id) : list;
  });
  if (!removed) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await removeImage(removed);
  await audit(user, 'photo.purge', { id });
  log('info', 'photo_purged', { id });
  return NextResponse.json({ ok: true });
}
