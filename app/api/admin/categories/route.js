import { NextResponse } from 'next/server';
import { adminGuard, requireOwner } from '@/lib/auth';
import { addCategory, validLabel } from '@/lib/categories';
import { audit } from '@/lib/audit';

export async function POST(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const label = String(body.label || '').trim();
  if (!validLabel(label)) return NextResponse.json({ error: 'invalid_label' }, { status: 400 });
  const r = await addCategory(label);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 409 });
  await audit(user, 'category.add', { label });
  return NextResponse.json(r.category, { status: 201 });
}
