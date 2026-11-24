import CommentForm from './CommentForm';
import Reveal from './Reveal';

const fmt = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

export default function SiteFooter({ comments, place }) {
  return (
    <footer className="border-t border-line px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="mx-auto grid max-w-[1280px] gap-4 md:grid-cols-[1.6fr_1fr] md:gap-6">
        <Reveal>
          <section aria-labelledby="ct">
            <h2 id="ct" className="mb-2 text-[.9rem] font-bold">التعليقات</h2>
            <CommentForm />
            <ul className="mt-2 grid max-h-48 gap-2 overflow-y-auto pe-1">
              {comments.length === 0 && <li className="text-[.9rem] text-muted">كن أول من يكتب تعليقًا.</li>}
              {comments.map((c) => (
                <li key={c.id} className="border-t border-line pt-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <strong className="text-[.92rem]">{c.name}</strong>
                    <time dateTime={c.createdAt} className="text-[.78rem] text-muted">{fmt(c.createdAt)}</time>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[.92rem]">{c.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
        {place && (
          <Reveal delay={150}>
            <section aria-labelledby="pl" className="content-start">
              <h2 id="pl" className="mb-1.5 text-[.9rem] font-bold">المكان</h2>
              <address className="not-italic text-[.92rem]">
                <p>{place.address}</p>
                {place.hours && <p className="text-muted">{place.hours}</p>}
              </address>
              {place.mapUrl && (
                <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[.92rem] font-medium text-accent underline underline-offset-4">
                  افتح على الخريطة
                </a>
              )}
            </section>
          </Reveal>
        )}
      </div>
    </footer>
  );
}
