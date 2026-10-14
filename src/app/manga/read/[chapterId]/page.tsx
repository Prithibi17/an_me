import Link from "next/link";
import { BookOpen, ChevronLeft } from "lucide-react";
import { getKuhiChapter, isKuhiMangaSource } from "@/lib/kuhi/client";
import { findMangaDexChapterPages, getMangaDexChapterPages } from "@/lib/mangadex/client";
import { MangaReader } from "@/components/manga/MangaReader";
import { resolveMangaCatalogFromTitles } from "@/lib/manga/catalog";

export default async function MangaReaderPage({ params, searchParams }: PageProps<"/manga/read/[chapterId]">) {
  const { chapterId } = await params;
  const query = await searchParams;
  const sourceValue = typeof query.source === "string" ? query.source : undefined;
  const title = typeof query.title === "string" ? query.title : "Manga reader";
  const lookupTitle = typeof query.lookup === "string" ? query.lookup : title;
  const chapterNumber = typeof query.chapter === "string" ? query.chapter : undefined;
  const source = isKuhiMangaSource(sourceValue) ? sourceValue : "vortex";
  const directMangaDex = source === "mangadex" ? await getMangaDexChapterPages(chapterId) : null;
  const chapter = directMangaDex ? null : await getKuhiChapter(chapterId, source);
  const kuhiPages = (chapter?.pages || []).map((page) => typeof page === "string" ? page : page.url).filter(Boolean);
  const mangaDexFallback = !directMangaDex && !kuhiPages.length && chapterNumber
    ? await findMangaDexChapterPages(title, chapterNumber)
    : null;
  const pages = directMangaDex?.pages || (kuhiPages.length ? kuhiPages : mangaDexFallback?.pages) || [];
  const catalog = await resolveMangaCatalogFromTitles([lookupTitle, title]);

  return <main className="min-h-screen bg-[#050608] text-white"><header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0f14]/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4"><Link href="/manga" className="inline-flex items-center gap-1 text-sm font-bold text-white/65 hover:text-[#ff2f6d]"><ChevronLeft className="h-4 w-4" />Manga</Link><div className="min-w-0 text-right"><h1 className="truncate text-sm font-black">{title}</h1><p className="text-[11px] uppercase tracking-wider text-white/35">Manga reader</p></div></div></header>{pages.length ? <MangaReader title={title} lookupTitle={catalog?.title || lookupTitle} pages={pages} currentChapterId={chapterId} currentChapterNumber={chapterNumber} source={catalog?.source || source} poster={catalog?.poster} description={catalog?.description} chapters={catalog?.chapters || []} /> : <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center"><BookOpen className="h-12 w-12 text-[#ff2f6d]" /><h1 className="text-2xl font-black">Chapter pages are temporarily unavailable</h1><p className="text-sm leading-6 text-white/50">The chapter exists, but the source did not return readable page images. Please try this chapter again later or choose another chapter.</p><Link href="/manga" className="rounded-full bg-[#ff2f6d] px-5 py-2.5 text-sm font-black">Back to manga</Link></div>}</main>;
}
