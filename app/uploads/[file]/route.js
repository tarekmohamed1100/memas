import fs from 'node:fs/promises';
import path from 'node:path';
import { uploadsDir } from '@/lib/files';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const { file } = await params;
  if (!/^[a-f0-9]{16}\.webp$/.test(file)) return new Response('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(path.join(uploadsDir, file));
    return new Response(buf, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
