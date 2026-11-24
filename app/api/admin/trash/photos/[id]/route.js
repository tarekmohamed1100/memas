import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { audit } from '@/lib/audit';
import { adminGuard, requireOwner } from '@/lib/auth';
import { photos } from '@/lib/store';
import { uploadsDir } from '@/lib/files';
import { log } from '@/lib/log';

// حذف نهائي: بيشيل الصورة من القائمة ومن الفولدر، ومش هترجع تاني
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

  await fs.unlink(path.join(uploadsDir, removed.file)).catch(() => {});
  log('info', 'photo_purged', { id });
  await audit(user, 'photo.purge');
  return NextResponse.json({ ok: true });
}
