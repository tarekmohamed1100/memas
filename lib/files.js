import fs from 'node:fs/promises';
import path from 'node:path';
import { put, del } from '@vercel/blob';
import { config } from './config';

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FILES = 20;
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const uploadsDir = path.join(config.dataDir, 'uploads');
export const ensureUploads = () => fs.mkdir(uploadsDir, { recursive: true });

// بيحفظ الصورة ويرجّع {file, url}. url فاضي لو اتحفظت على القرص
export async function saveImage(buffer, id) {
  const file = `${id}.webp`;
  if (useBlob) {
    const { url } = await put(`photos/${file}`, buffer, { access: 'public', contentType: 'image/webp', addRandomSuffix: false });
    return { file, url };
  }
  await ensureUploads();
  await fs.writeFile(path.join(uploadsDir, file), buffer);
  return { file, url: null };
}

export async function removeImage(photo) {
  if (photo.url) await del(photo.url).catch(() => {});
  else await fs.unlink(path.join(uploadsDir, photo.file)).catch(() => {});
}

export const photoSrc = (p) => p.url || `/uploads/${p.file}`;
