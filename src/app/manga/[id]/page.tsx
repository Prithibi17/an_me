import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronLeft, Star } from "lucide-react";
import { getMangaDetails, mangaDate, mangaTitle } from "@/lib/anilist/manga";

export default async function MangaDetailsPage({ params }: PageProps<"/manga/[id]">) {
  const { id } = await params;
  const manga = await getMangaDetails(Number(id));
  if (!manga) notFound();
  const title = mangaTitle(manga);
  return <div className="min-h-screen bg-[#090a0d] pb-16 text-white">
    <div className="relative min-h-[560px] overflow-hidden"><Image src={manga.bannerImage || manga.coverImage} alt="" fill priority sizes="100vw" className="object-cover opacity-25 blur-[2px]" /><div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/75 to-black/35" />
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-7 px-5 py-12 sm:flex-row sm:items-end sm:py-20"><div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 sm:w-64"><Image src={manga.coverImage} alt={title} fill sizes="256px" className="object-cover" /></div><div className="max-w-3xl space-y-4"><Link href="/manga" className="inline-flex items-center gap-1 text-xs font-bold text-white/50 hover:text-[#ff2f6d]"><ChevronLeft className="h-4 w-4" />Manga home</Link><h1 className="text-4xl font-black sm:text-6xl">{title}</h1><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded bg-[#ff2f6d] px-2 py-1">{manga.format || "MANGA"}</span><span className="rounded bg-white/10 px-2 py-1">{manga.status?.replaceAll("_", " ") || "UNKNOWN"}</span>{manga.score ? <span className="flex items-center gap-1 rounded bg-amber-400/15 px-2 py-1 text-amber-300"><Star className="h-3 w-3 fill-current" />{(manga.score / 10).toFixed(1)}</span> : null}</div><p className="leading-7 text-white/65">{manga.description || "No synopsis is currently available."}</p><div className="flex flex-wrap gap-5 text-sm text-white/55"><span><b className="text-white">Chapters:</b> {manga.chapters || "Ongoing"}</span><span><b className="text-white">Volumes:</b> {manga.volumes || "—"}</span><span><b className="text-white">Started:</b> {mangaDate(manga)}</span></div><button type="button" className="inline-flex items-center gap-2 rounded-full bg-[#ff2f6d] px-5 py-2.5 text-sm font-black"><BookOpen className="h-4 w-4" />Add to reading list</button></div></div>
    </div>
  </div>;
}
