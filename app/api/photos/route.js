import { NextResponse } from 'next/server';
import { photos } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const list = (await photos.read())
    .filter((p) => !p.deletedAt)
    .map(({ id, file, w, h, category }) => ({ id, file, url: `/uploads/${file}`, w, h, category: category || '' }));
  return NextResponse.json(list);
}
