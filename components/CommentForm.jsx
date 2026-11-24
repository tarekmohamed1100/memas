'use client';
import { useState } from 'react';

const MSG = {
  invalid: 'اكتب اسمك وتعليقك (التعليق من حرفين إلى 500 حرف).',
  no_links: 'من فضلك اكتب التعليق من غير روابط.',
  too_many: 'أرسلت تعليقات كثيرة. حاول بعد قليل.',
  busy: 'الخدمة مشغولة الآن. حاول لاحقًا.',
};

export default function CommentForm() {
  const [status, setStatus] = useState({ text: '', err: false });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      name: String(fd.get('name') || '').trim(),
      text: String(fd.get('text') || '').trim(),
      website: String(fd.get('website') || ''),
    };
    if (!body.name || body.text.length < 2) return setStatus({ text: MSG.invalid, err: true });
    setBusy(true);
    setStatus({ text: 'جارٍ الإرسال…', err: false });
    try {
      const r = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error);
      form.reset();
      setStatus({ text: 'تم استلام تعليقك وهيظهر بعد مراجعته. شكرًا!', err: false });
    } catch (err) {
      setStatus({ text: MSG[err.message] || 'تعذّر إرسال التعليق. حاول مرة أخرى.', err: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-2">
        <label htmlFor="cname" className="mb-1 block text-[.92rem] font-medium">الاسم</label>
        <input id="cname" name="name" maxLength={40} autoComplete="name" className="w-full rounded-sm border border-line bg-transparent px-3 py-2 text-ink" />
      </div>
      <div className="mb-2">
        <label htmlFor="ctext" className="mb-1 block text-[.92rem] font-medium">تعليقك</label>
        <textarea id="ctext" name="text" maxLength={500} className="min-h-[60px] w-full resize-y rounded-sm border border-line bg-transparent px-3 py-2 text-ink" />
      </div>
      {/* خانة مخفية للبوتات */}
      <div className="hidden" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={busy} className="btn-anim min-h-9 rounded-sm bg-accent px-4 py-1.5 font-bold text-onaccent disabled:opacity-60">
        إرسال التعليق
      </button>
      <p role="status" className={`mt-2 min-h-5 text-[.88rem] ${status.err ? 'text-danger' : 'text-muted'}`}>{status.text}</p>
    </form>
  );
}
