import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { adminGuard } from '@/lib/auth';
import { photos } from '@/lib/store';

export async function POST(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  let found = false;
  await photos.mutate((list) => list.map((p) => {
    if (p.id !== id || !p.deletedAt) return p;
    found = true;
    return { ...p, deletedAt: undefined }; // بترجع في مكانها الأصلي في المعرض
  }));
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'photo.restore');
  return NextResponse.json({ ok: true });
}
