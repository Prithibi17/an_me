import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronLeft, Library, Lock, Star } from "lucide-react";
import { getMangaDetails, mangaDate, mangaTitle, publicationType } from "@/lib/anilist/manga";
import { resolveMangaCatalogFromTitles } from "@/lib/manga/catalog";

export default async function MangaDetailsPage({ params }: PageProps<"/manga/[id]">) {
  const { id } = await params;
  const manga = await getMangaDetails(Number(id));
  if (!manga) notFound();
  const title = mangaTitle(manga);
  const kind = publicationType(manga.countryOfOrigin, manga.format);
  const catalog = await resolveMangaCatalogFromTitles([title, manga.title.english, manga.title.romaji, manga.title.native, ...(manga.synonyms || [])], kind);
  const chapters = [...(catalog?.chapters || [])].sort((a, b) => Number(a.number) - Number(b.number));
  const readableChapters = chapters.filter((chapter) => !chapter.is_locked);
  const firstChapter = readableChapters[0];
  const lastChapter = chapters.at(-1);
  const cover = manga.coverImage || catalog?.poster || "/anme-icon.png";
  const readerHref = firstChapter && catalog ? `/manga/read/${encodeURIComponent(firstChapter.id)}?source=${catalog.source}&title=${encodeURIComponent(title)}&lookup=${encodeURIComponent(catalog.title)}&chapter=${encodeURIComponent(firstChapter.number)}` : null;

  return <div className="min-h-screen bg-[#090a0d] pb-16 text-white">
    <div className="relative min-h-[560px] overflow-hidden">
      <Image src={manga.bannerImage || cover} alt="" fill priority sizes="100vw" className="object-cover opacity-25 blur-[2px]" /><div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/75 to-black/35" />
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-7 px-5 py-12 sm:flex-row sm:items-end sm:py-20">
        <div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 sm:w-64"><Image src={cover} alt={title} fill sizes="256px" className="object-cover" /></div>
        <div className="max-w-3xl space-y-4"><Link href="/manga" className="inline-flex items-center gap-1 text-xs font-bold text-white/50 hover:text-[#ff2f6d]"><ChevronLeft className="h-4 w-4" />Manga home</Link><h1 className="text-4xl font-black sm:text-6xl">{title}</h1><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded bg-[#ff2f6d] px-2 py-1">{kind}</span><span className="rounded bg-white/10 px-2 py-1">{manga.status?.replaceAll("_", " ") || catalog?.status || "UNKNOWN"}</span>{manga.score ? <span className="flex items-center gap-1 rounded bg-amber-400/15 px-2 py-1 text-amber-300"><Star className="h-3 w-3 fill-current" />{(manga.score / 10).toFixed(1)}</span> : null}</div><p className="leading-7 text-white/65">{manga.description || catalog?.description || "No synopsis is currently available."}</p><div className="flex flex-wrap gap-5 text-sm text-white/55"><span><b className="text-white">Released chapters:</b> {catalog?.total_chapters || chapters.length || manga.chapters || "Ongoing"}</span><span><b className="text-white">Readable:</b> {readableChapters.length || "—"}</span><span><b className="text-white">Volumes:</b> {manga.volumes || "—"}</span><span><b className="text-white">Started:</b> {mangaDate(manga)}</span></div>{readerHref ? <Link href={readerHref} className="inline-flex items-center gap-2 rounded-full bg-[#ff2f6d] px-5 py-2.5 text-sm font-black hover:bg-[#ff477c]"><BookOpen className="h-4 w-4" />Start reading — Chapter {firstChapter.number}</Link> : null}</div>
      </div>
    </div>
    <section className="mx-auto max-w-[1500px] px-5 pt-8"><div className="mb-5 flex items-center gap-3"><Library className="h-6 w-6 text-[#ff2f6d]" /><div><h2 className="text-2xl font-black">{firstChapter && lastChapter ? `Available chapters ${firstChapter.number}–${lastChapter.number}` : "Chapters"}</h2><p className="text-sm text-white/45">{chapters.length ? `${chapters.length} verified chapter${chapters.length === 1 ? "" : "s"}, ordered by their real chapter numbers.` : "No verified chapter list is currently available."} Locked chapters are shown but cannot be opened.</p></div></div>{catalog && chapters.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{chapters.map((chapter) => chapter.is_locked ? <div key={chapter.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#101217] px-4 py-3 text-white/35"><span className="min-w-0"><b className="block text-sm">Chapter {chapter.number}</b><span className="block truncate text-xs">{chapter.title || `Chapter ${chapter.number}`}</span></span><Lock className="h-4 w-4 shrink-0" /></div> : <Link key={chapter.id} href={`/manga/read/${encodeURIComponent(chapter.id)}?source=${catalog.source}&title=${encodeURIComponent(title)}&lookup=${encodeURIComponent(catalog.title)}&chapter=${encodeURIComponent(chapter.number)}`} className="group flex items-center justify-between rounded-xl border border-white/8 bg-[#13151b] px-4 py-3 transition hover:border-[#ff2f6d]/60 hover:bg-[#191b22]"><span className="min-w-0"><b className="block text-sm">Chapter {chapter.number}</b><span className="block truncate text-xs text-white/45">{chapter.title || `Chapter ${chapter.number}`}</span></span><BookOpen className="h-4 w-4 shrink-0 text-white/30 group-hover:text-[#ff2f6d]" /></Link>)}</div> : <div className="rounded-xl border border-white/8 bg-[#13151b] p-8 text-center text-sm text-white/50">No released chapters are available from the connected catalog yet.</div>}</section>
  </div>;
}
