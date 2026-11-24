import { NextResponse } from 'next/server';
import { adminGuard, requireOwner } from '@/lib/auth';
import { activity } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const forbidden = requireOwner(user);
  if (forbidden) return forbidden;
  return NextResponse.json((await activity.read()).slice(0, 100));
}
