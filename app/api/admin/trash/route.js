import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/auth';
import { photos, comments } from '@/lib/store';
import { photoSrc } from '@/lib/files';

export const dynamic = 'force-dynamic';

// كل اللي اتحذف (صور وتعليقات) عشان اللوحة تعرضه
export async function GET(request) {
  const { denied } = await adminGuard(request);
  if (denied) return denied;
  const [p, c] = await Promise.all([photos.read(), comments.read()]);
  return NextResponse.json({
    photos: p.filter((x) => x.deletedAt).map((x) => ({ id: x.id, file: x.file, url: photoSrc(x), deletedAt: x.deletedAt })),
    comments: c.filter((x) => x.deletedAt),
  });
}
