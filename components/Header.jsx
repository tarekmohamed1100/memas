import { config } from "@/lib/config";
import { Icon } from "./Icons";

const SOCIAL = [
  { key: "facebook", label: "فيسبوك", href: "https://www.facebook.com/share/1DmpQSqGKb/" },
  { key: "tiktok", label: "تيك توك", href: "https://www.tiktok.com/@ahmedmemas3" },
  { key: "whatsapp", label: "واتساب", href: "/api/wa?from=header" },
];

export default function Header() {
  return (
    <header id="top" className="anim-fade-down border-b border-line">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2 text-[.85rem] sm:gap-3 sm:px-8 sm:text-[.9rem]">
        <nav aria-label="تابعنا" className="col-start-1 row-start-1 flex items-center gap-1.5 justify-self-start sm:gap-2">
          {SOCIAL.map((s) => (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:h-8 sm:w-8"
            >
              <Icon name={s.key} className="h-4 w-4" />
            </a>
          ))}
        </nav>
        <a
          href="#top"
          className="col-start-2 row-start-1 justify-self-center whitespace-nowrap font-medium text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          الرئيسية
        </a>
        <div className="col-start-3 row-start-1 flex min-w-0 items-center justify-self-end gap-2">
          <strong className="truncate font-bold">{config.studio}</strong>
          <img
            src="/logo.webp"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 flex-none rounded-full sm:h-8 sm:w-8"
          />
        </div>
      </div>
    </header>
  );
}
