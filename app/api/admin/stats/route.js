import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/auth';
import { waEvents } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { denied } = await adminGuard(request);
  if (denied) return denied;

  const events = await waEvents.read();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const byFrom = {};
  events.forEach((e) => { byFrom[e.from] = (byFrom[e.from] || 0) + 1; });
  return NextResponse.json({
    total: events.length,
    today: events.filter((e) => Date.parse(e.at) >= startOfDay.getTime()).length,
    week: events.filter((e) => Date.parse(e.at) >= weekAgo).length,
    byFrom,
  });
}
