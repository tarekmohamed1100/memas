'use client';
import { useEffect, useRef, useState } from 'react';

const ERR = {
  bad_credentials: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
  too_many_attempts: 'محاولات كثيرة. حاول بعد 15 دقيقة.',
  file_too_large: 'حجم إحدى الصور أكبر من 15 ميجا.',
  no_files: 'اختر صورة واحدة على الأقل.',
  not_found: 'العنصر ده مش موجود، ممكن يكون اتحذف قبل كده.',
  list_changed: 'القائمة اتغيّرت. تم تحديثها، أعد المحاولة.',
  forbidden_role: 'الصلاحية دي للمالك بس.',
  username_taken: 'اسم المستخدم ده موجود قبل كده.',
  invalid_username: 'اسم المستخدم من 3 لـ 30 حرف إنجليزي أو أرقام أو . _ -',
  invalid_name: 'اكتب الاسم الظاهر (40 حرف كحد أقصى).',
  weak_password: 'كلمة السر لازم تكون 8 حروف على الأقل.',
  wrong_current: 'كلمة السر الحالية غير صحيحة.',
  category_exists: 'القسم ده موجود قبل كده.',
  invalid_label: 'اسم القسم من 1 لـ 30 حرف.',
  same_password: 'كلمة السر الجديدة لازم تكون غير القديمة.',
  server_misconfigured: 'إعدادات السيرفر ناقصة (ADMIN_PASSWORD أو SESSION_SECRET).',
};

const ACTIONS = {
  login: 'تسجيل دخول',
  'photo.upload': 'رفع صور',
  'photo.trash': 'نقل صورة للمحذوفات',
  'photo.restore': 'استعادة صورة',
  'photo.purge': 'حذف صورة نهائيًا',
  'photo.reorder': 'ترتيب الصور',
  'photo.category': 'تغيير قسم صورة',
  'category.add': 'إضافة قسم',
  'category.remove': 'حذف قسم',
  'comment.approve': 'نشر تعليق',
  'comment.trash': 'نقل تعليق للمحذوفات',
  'comment.restore': 'استعادة تعليق',
  'comment.purge': 'حذف تعليق نهائيًا',
  'user.create': 'إضافة مستخدم',
  'user.status': 'تغيير حالة مستخدم',
  'user.password': 'تغيير كلمة سر مستخدم',
};

async function api(path, opts = {}) {
  const r = await fetch(path, {
    credentials: 'same-origin',
    ...opts,
    headers: { 'X-Requested-With': 'admin', ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'error'), { code: j.error, status: r.status, body: j });
  return j;
}
const json = (body) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const input = 'w-full rounded-md border border-line bg-card px-3 py-2 text-ink';
const btn = 'min-h-9 rounded-md border border-line bg-card px-3 font-bold text-ink hover:border-accent disabled:opacity-50';
const btnPrimary = 'btn-anim rounded-md bg-accent px-4 py-2 font-bold text-onaccent disabled:opacity-60';
const btnDanger = `${btn} text-danger`;
const panel = 'mb-5 rounded-md border border-line bg-card p-4';

export default function AdminPage() {
  const [authed, setAuthed] = useState(null);
  const [me, setMe] = useState(null);
  const [login, setLogin] = useState({ username: '', password: '' });
  const [photos, setPhotos] = useState([]);
  const [comments, setComments] = useState([]);
  const [trash, setTrash] = useState({ photos: [], comments: [] });
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [stats, setStats] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '' });
  const [showTrash, setShowTrash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', err: false });
  const fileRef = useRef(null);
  const trashRef = useRef(null);
  const usersRef = useRef(null);
  const isOwner = me?.role === 'owner';

  const say = (text, err = false) => setMsg({ text, err });
  const fail = (e) => {
    if (e.status === 401) setAuthed(false);
    say(ERR[e.code] || 'تعذّر تنفيذ العملية. حاول مرة أخرى.', true);
  };

  async function refresh(owner) {
    const [p, c, t, st, cats] = await Promise.all([api('/api/photos'), api('/api/admin/comments'), api('/api/admin/trash'), api('/api/admin/stats'), api('/api/categories')]);
    setPhotos(p); setComments(c); setTrash(t); setStats(st);
    setCategories(cats);
    setCategory((prev) => (cats.some((x) => x.key === prev) ? prev : (cats[0]?.key || '')));
    if (owner) {
      const [u, a] = await Promise.all([api('/api/admin/users'), api('/api/admin/activity')]);
      setUsers(u); setActivity(a);
    }
  }

  useEffect(() => {
    if (showTrash) trashRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showTrash]);

  useEffect(() => {
    api('/api/admin/me')
      .then(({ user }) => { setMe(user); setAuthed(true); return refresh(user.role === 'owner'); })
      .catch(() => setAuthed(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تنفيذ أي عملية ثم تحديث القوائم
  async function run(fn, okText) {
    try {
      await fn();
      if (okText) say(okText);
      await refresh(isOwner);
    } catch (err) {
      if (err.status === 404 || err.status === 409) await refresh(isOwner).catch(() => {});
      fail(err);
    }
  }

  async function doLogin(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await api('/api/admin/login', { method: 'POST', ...json(login) });
      setMe(user); setAuthed(true); setLogin({ username: '', password: '' }); say('');
      await refresh(user.role === 'owner');
    } catch (err) { fail(err); }
    finally { setBusy(false); }
  }

  async function logout() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setAuthed(false); setMe(null);
    setPhotos([]); setComments([]); setTrash({ photos: [], comments: [] }); setUsers([]); setActivity([]);
  }

  async function upload() {
    const files = fileRef.current?.files;
    if (!files?.length) return say(ERR.no_files, true);
    const fd = new FormData();
    [...files].forEach((f) => fd.append('photos', f));
    fd.append('category', category);
    setBusy(true);
    say(`جارٍ رفع ${files.length} صورة…`);
    try {
      const r = await api('/api/admin/photos', { method: 'POST', body: fd });
      fileRef.current.value = '';
      await refresh(isOwner);
      say(`تم رفع ${r.added} صورة${r.failed.length ? `، وتعذّر رفع ${r.failed.length} (${r.failed.map((f) => f.name).join('، ')})` : ''}.`, r.failed.length > 0);
    } catch (err) {
      if (err.status === 422) say('الملفات دي مش صور صالحة.', true);
      else fail(err);
    } finally { setBusy(false); }
  }

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    return run(() => api('/api/admin/photos/order', { method: 'PUT', ...json({ ids: next.map((p) => p.id) }) }));
  };

  const trashPhoto = (p, i) => confirm(`نقل الصورة رقم ${i + 1} للمحذوفات؟`) &&
    run(() => api(`/api/admin/photos/${p.id}`, { method: 'DELETE' }), 'تم نقل الصورة للمحذوفات.');
  const restorePhoto = (p) =>
    run(() => api(`/api/admin/photos/${p.id}/restore`, { method: 'POST' }), 'تم استعادة الصورة.');
  const purgePhoto = (p) => confirm('حذف الصورة نهائيًا؟ مش هترجع تاني.') &&
    run(() => api(`/api/admin/trash/photos/${p.id}`, { method: 'DELETE' }), 'تم حذف الصورة نهائيًا.');

  const trashComment = (c) =>
    run(() => api(`/api/admin/comments/${c.id}`, { method: 'DELETE' }), 'تم نقل التعليق للمحذوفات.');
  const approve = (c) =>
    run(() => api(`/api/admin/comments/${c.id}/approve`, { method: 'POST' }), 'تم نشر التعليق.');
  const restoreComment = (c) =>
    run(() => api(`/api/admin/comments/${c.id}/restore`, { method: 'POST' }), 'تم استعادة التعليق.');
  const purgeComment = (c) => confirm('حذف التعليق نهائيًا؟') &&
    run(() => api(`/api/admin/trash/comments/${c.id}`, { method: 'DELETE' }), 'تم حذف التعليق نهائيًا.');

  async function changeOwnPassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) return say('كلمتا السر الجديدتين مش متطابقتين.', true);
    setBusy(true);
    try {
      await api('/api/admin/me/password', { method: 'POST', ...json({ current: pwForm.current, next: pwForm.next }) });
      setPwForm({ current: '', next: '', confirm: '' });
      setPwOpen(false);
      say('تم تغيير كلمة السر.');
    } catch (err) {
      // هنا مش بنقفل الجلسة حتى لو الكلمة القديمة غلط
      say(ERR[err.code] || 'تعذّر تغيير كلمة السر.', true);
    } finally { setBusy(false); }
  }

  const setPhotoCategory = (p, cat) =>
    run(() => api(`/api/admin/photos/${p.id}/category`, { method: 'POST', ...json({ category: cat }) }), 'تم تغيير القسم.');

  const addCategory = (e) => {
    e.preventDefault();
    return run(async () => {
      await api('/api/admin/categories', { method: 'POST', ...json({ label: newCategory.trim() }) });
      setNewCategory('');
    }, 'تم إضافة القسم.');
  };
  const removeCategory = (c) => confirm(`حذف قسم «${c.label}»؟ الصور اللي فيه هتفضل بدون قسم.`) &&
    run(() => api(`/api/admin/categories/${c.key}`, { method: 'DELETE' }), 'تم حذف القسم.');

  // ----- المالك بس -----
  async function createUser(e) {
    e.preventDefault();
    await run(async () => {
      await api('/api/admin/users', { method: 'POST', ...json(newUser) });
      setNewUser({ name: '', username: '', password: '' });
    }, 'تم إضافة المستخدم. ابعتله اسم المستخدم وكلمة السر.');
  }
  const setStatus = (u, disabled) =>
    run(() => api(`/api/admin/users/${u.id}/status`, { method: 'POST', ...json({ disabled }) }),
      disabled ? 'تم تعطيل الحساب.' : 'تم تفعيل الحساب.');
  const resetPassword = (u) => {
    const pw = prompt(`كلمة السر الجديدة لـ ${u.username} (8 حروف على الأقل):`);
    if (pw) return run(() => api(`/api/admin/users/${u.id}/password`, { method: 'POST', ...json({ password: pw }) }), 'تم تغيير كلمة السر.');
  };

  if (authed === null) return <p className="p-10 text-center text-muted">جارٍ التحميل…</p>;

  if (!authed) {
    return (
      <main className="mx-auto mt-[12vh] w-[min(380px,calc(100%-2rem))] rounded-md border border-line bg-card p-5">
        <h1 className="text-xl font-bold">تسجيل الدخول</h1>
        <p className="mb-4 mt-1 text-muted">لوحة إدارة صور المعرض</p>
        <form onSubmit={doLogin}>
          <label htmlFor="un" className="mb-1.5 block font-medium">اسم المستخدم</label>
          <input id="un" autoComplete="username" value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} className={`${input} mb-3`} />
          <label htmlFor="pw" className="mb-1.5 block font-medium">كلمة المرور</label>
          <input id="pw" type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} className={input} />
          <p role="alert" className={`mb-3 mt-2.5 min-h-6 text-[.92rem] ${msg.err ? 'text-danger' : 'text-muted'}`}>{msg.text}</p>
          <button type="submit" disabled={busy} className={btnPrimary}>تسجيل الدخول</button>
        </form>
      </main>
    );
  }

  const trashCount = trash.photos.length + trash.comments.length;
  const pendingCount = comments.filter((c) => !c.approved).length;

  return (
    <main className="anim-fade-up mx-auto max-w-[1100px] px-4 pb-12 pt-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">إدارة المعرض</h1>
          <p className="text-[.9rem] text-muted">{me.name} · {isOwner ? 'مالك' : 'محرر'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/" className={`${btn} inline-flex items-center`}>عرض الموقع</a>
          <button onClick={() => setShowTrash((s) => !s)} aria-expanded={showTrash} className={btn}>المحذوفات ({trashCount})</button>
          {isOwner && <button onClick={() => usersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className={btn}>حسابات الموظفين</button>}
          {!isOwner && <button onClick={() => setPwOpen((o) => !o)} aria-expanded={pwOpen} className={btn}>كلمة السر</button>}
          <button onClick={logout} className={btn}>تسجيل الخروج</button>
        </div>
      </header>

      {pwOpen && !isOwner && (
        <section className={panel} aria-label="تغيير كلمة السر">
          <h2 className="mb-3 text-lg font-bold">تغيير كلمة السر</h2>
          <form onSubmit={changeOwnPassword} className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="cp" className="mb-1.5 block font-medium">كلمة السر الحالية</label>
              <input id="cp" type="password" autoComplete="current-password" dir="ltr" className={input} value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
            </div>
            <div>
              <label htmlFor="np2" className="mb-1.5 block font-medium">الجديدة (8 حروف على الأقل)</label>
              <input id="np2" type="password" autoComplete="new-password" dir="ltr" className={input} value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} />
            </div>
            <div>
              <label htmlFor="np3" className="mb-1.5 block font-medium">أكّد الجديدة</label>
              <input id="np3" type="password" autoComplete="new-password" dir="ltr" className={input} value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" disabled={busy} className={btnPrimary}>حفظ كلمة السر الجديدة</button>
            </div>
          </form>
          <p role="status" className={`mt-2.5 min-h-6 text-[.92rem] ${msg.err ? 'text-danger' : 'text-muted'}`}>{msg.text}</p>
        </section>
      )}

      {stats && (
        <section className={panel} aria-label="نقرات واتساب">
          <h2 className="mb-3 text-lg font-bold">نقرات واتساب</h2>
          <div className="flex flex-wrap gap-8">
            <div><div className="text-2xl font-bold text-accent">{stats.today}</div><div className="text-[.9rem] text-muted">النهارده</div></div>
            <div><div className="text-2xl font-bold">{stats.week}</div><div className="text-[.9rem] text-muted">آخر 7 أيام</div></div>
            <div><div className="text-2xl font-bold">{stats.total}</div><div className="text-[.9rem] text-muted">الإجمالي</div></div>
          </div>
          <p className="mt-3 text-[.9rem] text-muted">
            من الصور: {stats.byFrom.photo || 0} · الزر الثابت: {stats.byFrom.sticky || 0} · الفوتر: {stats.byFrom.footer || 0} · الهيدر: {stats.byFrom.header || 0}
          </p>
        </section>
      )}

      <section className={panel}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="files" className="mb-1.5 block font-medium">اختر صور (حتى 20 صورة، الواحدة حتى 15 ميجا)</label>
            <input ref={fileRef} id="files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/heic" className={input} />
          </div>
          <div className="w-44">
            <label htmlFor="cat" className="mb-1.5 block font-medium">القسم</label>
            <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <button onClick={upload} disabled={busy} className={btnPrimary}>رفع الصور</button>
        </div>
        <p role="status" className={`mt-2.5 min-h-6 text-[.92rem] ${msg.err ? 'text-danger' : 'text-muted'}`}>{msg.text}</p>
      </section>

      <ul className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5">
        {photos.map((p, i) => (
          <li key={p.id} className="overflow-hidden rounded-md border border-line bg-card">
            <img src={p.url} alt={`صورة رقم ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" />
            <div className="flex items-center gap-1.5 p-2">
              <span className="flex-1 text-[.9rem] text-muted">#{i + 1}</span>
              <button aria-label="قدّم الصورة" disabled={i === 0} onClick={() => move(i, -1)} className={btn}>↑</button>
              <button aria-label="أخّر الصورة" disabled={i === photos.length - 1} onClick={() => move(i, 1)} className={btn}>↓</button>
              <button aria-label={`نقل الصورة رقم ${i + 1} للمحذوفات`} onClick={() => trashPhoto(p, i)} className={btnDanger}>حذف</button>
            </div>
            <div className="px-2 pb-2">
              <select aria-label={`قسم الصورة رقم ${i + 1}`} value={categories.some((c) => c.key === p.category) ? p.category : ''} onChange={(e) => setPhotoCategory(p, e.target.value)} className={input}>
                {!categories.some((c) => c.key === p.category) && <option value="">بدون قسم</option>}
                {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </li>
        ))}
      </ul>
      {!photos.length && <p className="mb-8 text-muted">لا توجد صور بعد. ارفع أول صورة من الأعلى.</p>}

      <section className={panel}>
        <h2 className="mb-3 text-lg font-bold">
          التعليقات {pendingCount > 0 && <span className="font-normal text-muted">({pendingCount} بانتظار المراجعة)</span>}
        </h2>
        <ul className="grid gap-2.5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border border-line bg-bg p-3">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{c.name}</strong>
                <span className={`rounded-full border px-2 text-[.8rem] ${c.approved ? 'border-line text-muted' : 'border-accent text-accent'}`}>
                  {c.approved ? 'منشور' : 'بانتظار المراجعة'}
                </span>
              </div>
              <p className="my-2 whitespace-pre-wrap break-words">{c.text}</p>
              <div className="flex gap-2">
                {!c.approved && <button onClick={() => approve(c)} className={btnPrimary}>قبول ونشر</button>}
                <button onClick={() => trashComment(c)} className={btnDanger}>حذف</button>
              </div>
            </li>
          ))}
        </ul>
        {!comments.length && <p className="text-muted">لا توجد تعليقات بعد.</p>}
      </section>

      {showTrash && (
        <section ref={trashRef} aria-label="المحذوفات" className="mb-8 scroll-mt-4 rounded-md border border-dashed border-line p-4">
          <h2 className="mb-1 text-lg font-bold">المحذوفات</h2>
          <p className="mb-4 text-[.92rem] text-muted">
            الاستعادة بترجّع العنصر لمكانه.{' '}
            {isOwner ? 'الحذف النهائي مش هيرجع تاني.' : 'الحذف النهائي للمالك بس.'}
          </p>

          <h3 className="mb-2 font-bold">الصور ({trash.photos.length})</h3>
          {!trash.photos.length && <p className="mb-5 text-muted">مفيش صور محذوفة.</p>}
          <ul className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5">
            {trash.photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-md border border-line bg-card opacity-80">
                <img src={p.url} alt="صورة محذوفة" loading="lazy" className="aspect-square w-full object-cover grayscale" />
                <div className="flex gap-1.5 p-2">
                  <button onClick={() => restorePhoto(p)} className={`${btn} flex-1`}>استعادة</button>
                  {isOwner && <button onClick={() => purgePhoto(p)} className={btnDanger}>حذف نهائي</button>}
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mb-2 font-bold">التعليقات ({trash.comments.length})</h3>
          {!trash.comments.length && <p className="text-muted">مفيش تعليقات محذوفة.</p>}
          <ul className="grid gap-2.5">
            {trash.comments.map((c) => (
              <li key={c.id} className="rounded-md border border-line bg-bg p-3 opacity-80">
                <strong>{c.name}</strong>
                <p className="my-2 whitespace-pre-wrap break-words">{c.text}</p>
                <div className="flex gap-2">
                  <button onClick={() => restoreComment(c)} className={btn}>استعادة</button>
                  {isOwner && <button onClick={() => purgeComment(c)} className={btnDanger}>حذف نهائي</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isOwner && (
        <>
          <section className={panel} aria-label="الأقسام">
            <h2 className="mb-3 text-lg font-bold">الأقسام</h2>
            <ul className="mb-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.key} className="flex items-center gap-1 rounded-full border border-line bg-bg py-1 ps-3 pe-1">
                  <span>{c.label}</span>
                  <button aria-label={`حذف قسم ${c.label}`} onClick={() => removeCategory(c)} className="grid h-7 w-7 place-items-center rounded-full text-danger hover:bg-line">×</button>
                </li>
              ))}
            </ul>
            {!categories.length && <p className="mb-4 text-muted">مفيش أقسام. ضيف أول قسم من تحت.</p>}
            <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label htmlFor="ncat" className="mb-1.5 block font-medium">اسم القسم الجديد</label>
                <input id="ncat" className={input} value={newCategory} maxLength={30} onChange={(e) => setNewCategory(e.target.value)} />
              </div>
              <button type="submit" disabled={busy || !newCategory.trim()} className={btnPrimary}>إضافة قسم</button>
            </form>
          </section>

          <section ref={usersRef} className={`${panel} scroll-mt-4`}>
            <h2 className="mb-3 text-lg font-bold">حسابات الموظفين</h2>
            <ul className="mb-5 grid gap-2.5">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-bg p-3">
                  <div>
                    <strong>{u.name}</strong> <span className="text-muted">@{u.username}</span>
                    <span className={`mx-2 rounded-full border px-2 text-[.8rem] ${u.disabled ? 'border-danger text-danger' : 'border-accent text-accent'}`}>
                      {u.disabled ? 'معطّل' : 'مفعّل'}
                    </span>
                    <div className="text-[.85rem] text-muted">
                      آخر دخول: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-EG') : 'لسه ما دخلش'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resetPassword(u)} className={btn}>تغيير كلمة السر</button>
                    <button onClick={() => setStatus(u, !u.disabled)} className={u.disabled ? btn : btnDanger}>
                      {u.disabled ? 'تفعيل' : 'تعطيل'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {!users.length && <p className="mb-5 text-muted">لسه مفيش مستخدمين. ضيف أول محرر من تحت.</p>}

            <form onSubmit={createUser} className="grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
              <div>
                <label htmlFor="nn" className="mb-1.5 block font-medium">الاسم</label>
                <input id="nn" className={input} value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="nu" className="mb-1.5 block font-medium">اسم المستخدم</label>
                <input id="nu" dir="ltr" className={input} value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
              </div>
              <div>
                <label htmlFor="np" className="mb-1.5 block font-medium">كلمة سر مؤقتة</label>
                <input id="np" type="text" dir="ltr" className={input} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <button type="submit" disabled={busy} className={btnPrimary}>إضافة محرر</button>
                <span className="me-3 text-[.85rem] text-muted">الحساب بيتضاف كمحرر. يقدر يرفع ويرتب وينشر ويحذف للمحذوفات، بس مايقدرش يحذف نهائيًا.</span>
              </div>
            </form>
          </section>

          <section className={panel}>
            <h2 className="mb-3 text-lg font-bold">النشاط الأخير</h2>
            <ul className="grid gap-2 text-[.92rem]">
              {activity.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                  <span><strong>{a.name || a.user}</strong> · {ACTIONS[a.action] || a.action}{a.detail?.username ? ` (${a.detail.username})` : ''}</span>
                  <time className="text-muted">{new Date(a.at).toLocaleString('ar-EG')}</time>
                </li>
              ))}
            </ul>
            {!activity.length && <p className="text-muted">لسه مفيش نشاط.</p>}
          </section>
        </>
      )}
    </main>
  );
}
