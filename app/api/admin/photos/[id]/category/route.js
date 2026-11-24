import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/auth';
import { photos } from '@/lib/store';
import { categoryKeys } from '@/lib/categories';
import { audit } from '@/lib/audit';

export async function POST(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!(await categoryKeys()).includes(body.category)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  let found = false;
  await photos.mutate((list) => list.map((p) => {
    if (p.id !== id) return p;
    found = true;
    return { ...p, category: body.category };
  }));
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'photo.category', { id, category: body.category });
  return NextResponse.json({ ok: true });
}
