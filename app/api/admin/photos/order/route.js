import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { adminGuard } from '@/lib/auth';
import { photos } from '@/lib/store';

export async function PUT(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;

  let ids;
  try { ids = (await request.json())?.ids; } catch { ids = null; }
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  let conflict = false;
  await photos.mutate((list) => {
    // الترتيب بيخص الصور الظاهرة بس، والمحذوفات بتفضل في أماكنها
    const active = list.filter((p) => !p.deletedAt);
    const byId = new Map(active.map((p) => [p.id, p]));
    if (ids.length !== active.length || new Set(ids).size !== ids.length || !ids.every((i) => byId.has(i))) {
      conflict = true;
      return list;
    }
    let k = 0;
    return list.map((p) => (p.deletedAt ? p : byId.get(ids[k++])));
  });
  if (conflict) return NextResponse.json({ error: 'list_changed' }, { status: 409 });
  await audit(user, 'photo.reorder');
  return NextResponse.json({ ok: true });
}
