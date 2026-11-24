import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/auth';
import { photos, comments } from '@/lib/store';

export const dynamic = 'force-dynamic';

// كل اللي اتحذف (صور وتعليقات) عشان اللوحة تعرضه
export async function GET(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;
  const [p, c] = await Promise.all([photos.read(), comments.read()]);
  return NextResponse.json({
    photos: p.filter((x) => x.deletedAt).map(({ id, file, deletedAt }) => ({ id, file, url: `/uploads/${file}`, deletedAt })),
    comments: c.filter((x) => x.deletedAt),
  });
}
