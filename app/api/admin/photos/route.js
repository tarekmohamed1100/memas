import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { adminGuard } from '@/lib/auth';
import { photos } from '@/lib/store';
import { MAX_FILE_BYTES, MAX_FILES, saveImage, removeImage } from '@/lib/files';
import { categoryKeys } from '@/lib/categories';
import { audit } from '@/lib/audit';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const { denied, user } = await adminGuard(request);
  if (denied) return denied;

  const form = await request.formData();
  const files = form.getAll('photos').filter((f) => typeof f !== 'string' && f.size > 0).slice(0, MAX_FILES);
  if (!files.length) return NextResponse.json({ error: 'no_files' }, { status: 400 });
  const picked = String(form.get('category') || '');
  const keys = await categoryKeys();
  const category = keys.includes(picked) ? picked : (keys[0] || '');

  const added = [], failed = [], saved = [];
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) { failed.push({ name: f.name, error: 'file_too_large' }); continue; }
    try {
      const input = Buffer.from(await f.arrayBuffer());
      // إعادة ترميز: بتتأكد إنها صورة، بتصلّح الدوران، وبتشيل بيانات الموقع الجغرافي (EXIF)
      const { data, info } = await sharp(input, { limitInputPixels: 80e6 })
        .rotate()
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      const id = crypto.randomBytes(8).toString('hex');
      const stored = await saveImage(data, id);
      saved.push(stored);
      added.push({ id, ...stored, w: info.width, h: info.height, category, createdAt: new Date().toISOString() });
    } catch {
      failed.push({ name: f.name, error: 'invalid_image' });
    }
  }

  if (added.length) {
    try {
      await photos.mutate((list) => [...added, ...list]);
    } catch (e) {
      await Promise.all(saved.map(removeImage));
      throw e;
    }
  }
  await audit(user, 'photo.upload', { added: added.length, failed: failed.length });
  log('info', 'upload', { added: added.length, failed: failed.length });
  return NextResponse.json({ added: added.length, failed }, { status: added.length ? 201 : 422 });
}
