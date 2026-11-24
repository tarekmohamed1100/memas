import { NextResponse } from 'next/server';
import { adminGuard, requireOwner } from '@/lib/auth';
import { removeCategory } from '@/lib/categories';
import { audit } from '@/lib/audit';

// الصور اللي كانت في القسم بتفضل بدون قسم (مابتتحذفش)
export async function DELETE(request, { params }) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const { key } = await params;
  if (!(await removeCategory(key))) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await audit(user, 'category.remove', { key });
  return NextResponse.json({ ok: true });
}
