import { NextResponse } from 'next/server';
import { photos } from '@/lib/store';
import { photoSrc } from '@/lib/files';

export const dynamic = 'force-dynamic';

export async function GET() {
  const list = (await photos.read())
    .filter((p) => !p.deletedAt)
    .map((p) => ({ id: p.id, file: p.file, url: photoSrc(p), w: p.w, h: p.h, category: p.category || '' }));
  return NextResponse.json(list);
}
