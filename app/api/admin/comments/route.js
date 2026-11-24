import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/auth';
import { comments } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  return NextResponse.json((await comments.read()).filter((c) => !c.deletedAt));
}
