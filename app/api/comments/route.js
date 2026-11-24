import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { comments } from '@/lib/store';
import { overLimit, clientIp } from '@/lib/ratelimit';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function GET() {
  const approved = (await comments.read())
    .filter((c) => c.approved && !c.deletedAt)
    .slice(0, 100)
    .map(({ id, name, text, createdAt }) => ({ id, name, text, createdAt }));
  return NextResponse.json(approved);
}

export async function POST(request) {
  let b;
  try { b = await request.json(); } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }); }

  // خانة الفخ: البوتات بتملاها، فنرد بنجاح من غير ما نحفظ
  if (typeof b.website === 'string' && b.website) return NextResponse.json({ status: 'pending' }, { status: 202 });

  const clean = (v) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() : '');
  const name = clean(b.name), text = clean(b.text);
  if (!name || name.length > 40 || text.length < 2 || text.length > 500)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (/https?:\/\/|www\./i.test(`${name} ${text}`))
    return NextResponse.json({ error: 'no_links' }, { status: 400 });
  if (await overLimit(`comment:${clientIp(request)}`, 3, 10 * 60 * 1000))
    return NextResponse.json({ error: 'too_many' }, { status: 429 });
  if ((await comments.read()).filter((c) => !c.approved && !c.deletedAt).length >= 200)
    return NextResponse.json({ error: 'busy' }, { status: 503 });

  await comments.mutate((list) => [
    { id: crypto.randomBytes(8).toString('hex'), name, text, createdAt: new Date().toISOString(), approved: false },
    ...list,
  ]);
  log('info', 'comment_received');
  return NextResponse.json({ status: 'pending' }, { status: 202 });
}
