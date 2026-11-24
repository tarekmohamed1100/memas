'use client';
import { useState } from 'react';
import { Icon } from './Icons';

export default function GalleryTabs({ items, categories }) {
  const [active, setActive] = useState('all');
  if (!items.length) return <p className="py-16 text-center text-muted">لا توجد صور حاليًا.</p>;

  const count = (k) => (k === 'all' ? items.length : items.filter((p) => p.category === k).length);
  const tabs = [{ key: 'all', label: 'الكل' }, ...categories].filter((t) => t.key === 'all' || count(t.key) > 0);
  const shown = active === 'all' ? items : items.filter((p) => p.category === active);

  return (
    <>
      <div role="tablist" aria-label="أقسام المعرض" className="anim-fade-down mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={`btn-anim rounded-full border px-4 py-1.5 text-[.95rem] font-medium ${active === t.key ? 'border-accent bg-accent text-onaccent' : 'border-line text-muted hover:text-ink'}`}
          >
            {t.label} <span className="opacity-70">({count(t.key)})</span>
          </button>
        ))}
      </div>
      <div className="columns-2 gap-3.5 sm:columns-3">
        {shown.map((p, i) => {
          const src = p.src;
          return (
            <div key={p.id} className="anim-fade-up relative mb-3.5 break-inside-avoid" style={{ '--d': `${Math.min(i, 12) * 70}ms` }}>
              <a
                href={`/api/wa?from=photo&n=${p.n}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`تواصل عبر واتساب بخصوص الصورة رقم ${p.n}`}
                className="group relative block overflow-hidden rounded-sm bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px]"
              >
                <img
                  src={src}
                  alt={`صورة رقم ${p.n}`}
                  width={p.w}
                  height={p.h}
                  loading="lazy"
                  className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="touch-show absolute bottom-3 start-3 flex translate-y-2 items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-[.9rem] font-bold text-onaccent opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <Icon name="chat" className="h-[18px] w-[18px] flex-none" />
                  <span>تواصل عبر واتساب</span>
                </span>
              </a>
              <a
                href={src}
                target="_blank"
                rel="noopener"
                aria-label={`عرض الصورة رقم ${p.n} بالحجم الكامل`}
                title="الحجم الكامل"
                className="absolute end-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon name="expand" className="h-[18px] w-[18px]" />
              </a>
            </div>
          );
        })}
      </div>
    </>
  );
}
