import Header from '@/components/Header';
import GalleryTabs from '@/components/GalleryTabs';
import SiteFooter from '@/components/SiteFooter';
import { photos, comments } from '@/lib/store';
import { config } from '@/lib/config';
import { listCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [list, all, cats] = await Promise.all([photos.read(), comments.read(), listCategories()]);
  // الترقيم بيتحسب على الصور الظاهرة، زي ما الزائر شايفها
  const items = list
    .filter((p) => !p.deletedAt)
    .map((p, i) => ({ id: p.id, file: p.file, w: p.w, h: p.h, category: p.category || '', n: i + 1 }));
  const approved = all
    .filter((c) => c.approved && !c.deletedAt)
    .slice(0, 100)
    .map(({ id, name, text, createdAt }) => ({ id, name, text, createdAt }));
  const place = config.address ? { address: config.address, hours: config.hours, mapUrl: config.mapUrl } : null;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-10 pt-5">
        <GalleryTabs items={items} categories={cats} />
      </main>
      <SiteFooter comments={approved} place={place} />
    </>
  );
}
