import { NextResponse } from 'next/server';
import { config, waLink } from '@/lib/config';
import { waEvents } from '@/lib/store';

export const dynamic = 'force-dynamic';

const SOURCES = ['photo', 'sticky', 'footer', 'header'];

export async function GET(request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('from');
  const from = SOURCES.includes(raw) ? raw : 'other';
  const n = Math.min(Math.max(parseInt(url.searchParams.get('n') || '0', 10) || 0, 0), 9999);

  try {
    await waEvents.mutate((list) => [{ at: new Date().toISOString(), from }, ...list].slice(0, 5000));
  } catch {
    // العد مايوقفش الزائر يوصل للواتساب
  }
  const target = from === 'photo' && n ? waLink(n) : config.social.whatsapp;
  return NextResponse.redirect(target, 302);
}
