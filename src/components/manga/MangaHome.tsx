import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Clock3, Flame, Star } from "lucide-react";
import type { Manga } from "@/lib/anilist/manga";
import { mangaDate, mangaTitle } from "@/lib/anilist/manga";
import { ContinueReading } from "./ContinueReading";

function MangaCard({ manga }: { manga: Manga }) {
  const title = mangaTitle(manga);
  return (
    <article className="group min-w-0">
      <Link href={`/manga/${manga.id}`} className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-[#151821] ring-1 ring-white/7">
        <Image src={manga.coverImage} alt={title} fill sizes="(max-width: 640px) 50vw, 16vw" className="object-cover transition duration-300 group-hover:scale-105 group-hover:saturate-125" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent" />
        <span className="absolute bottom-2 left-2 rounded bg-[#ff2f6d] px-1.5 py-0.5 text-[9px] font-black text-white">{manga.format || "MANGA"}</span>
      </Link>
      <Link href={`/manga/${manga.id}`} className="mt-2 block truncate text-xs font-bold text-white transition hover:text-[#ff2f6d]" title={title}>{title}</Link>
      <p className="mt-1 flex gap-1.5 text-[10px] font-medium text-white/45">
        <span>{manga.chapters ? `${manga.chapters} chapters` : manga.status === "RELEASING" ? "Releasing" : "Chapters ongoing"}</span>
        {manga.score ? <><span>•</span><span className="text-amber-300">★ {(manga.score / 10).toFixed(1)}</span></> : null}
      </p>
    </article>
  );
}

function Section({ title, icon: Icon, items, href = "/manga" }: { title: string; icon: typeof Flame; items: Manga[]; href?: string }) {
  if (!items.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-black text-white sm:text-xl"><Icon className="h-5 w-5 text-[#ff2f6d]" />{title}</h2>
        <Link href={href} className="flex items-center gap-1 text-xs font-bold text-white/45 transition hover:text-[#ff2f6d]">View more <ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{items.slice(0, 12).map((manga) => <MangaCard key={manga.id} manga={manga} />)}</div>
    </section>
  );
}

export function MangaHome({ trending, latest, upcoming, top, searchResults, searchQuery }: { trending: Manga[]; latest: Manga[]; upcoming: Manga[]; top: Manga[]; searchResults?: Manga[]; searchQuery?: string }) {
  const hero = trending.find((item) => item.bannerImage) || trending[0];
  return <div className="min-h-screen bg-[#0a0b0e] text-white">
    {hero ? <section className="relative min-h-[430px] overflow-hidden border-b border-white/5">
      <Image src={hero.bannerImage || hero.coverImage} alt={mangaTitle(hero)} fill priority sizes="100vw" className="object-cover object-center opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0d] via-[#090a0d]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-transparent to-black/20" />
      <div className="relative mx-auto flex min-h-[430px] max-w-[1720px] items-center px-4 sm:px-8">
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-black uppercase tracking-[.22em] text-[#ff2f6d]">Manga spotlight</span>
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">{mangaTitle(hero)}</h1>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-white/70"><span className="rounded bg-white/10 px-2 py-1">{hero.format || "MANGA"}</span><span className="rounded bg-white/10 px-2 py-1">{hero.status?.replaceAll("_", " ") || "Published"}</span>{hero.score ? <span className="rounded bg-amber-400/15 px-2 py-1 text-amber-300">★ {(hero.score / 10).toFixed(1)}</span> : null}</div>
          <p className="line-clamp-3 max-w-xl text-sm leading-6 text-white/65">{hero.description || "Discover popular manga, manhwa and manhua, with current publishing information from AniList."}</p>
          <Link href={`/manga/${hero.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#ff2f6d] px-5 py-2.5 text-sm font-black shadow-lg shadow-[#ff2f6d]/25"><BookOpen className="h-4 w-4" />View details</Link>
        </div>
      </div>
    </section> : null}

    <div className="mx-auto grid w-full max-w-[1720px] grid-cols-1 gap-7 px-3 py-7 sm:px-6 lg:grid-cols-12 lg:px-8">
      <main className="space-y-10 lg:col-span-9">
        {searchQuery ? <Section title={`Search results for “${searchQuery}”`} icon={BookOpen} items={searchResults || []} /> : null}
        <ContinueReading />
        <Section title="Trending Manga" icon={Flame} items={trending} />
        <Section title="Latest Releases" icon={Clock3} items={latest} />
        <Section title="Upcoming Manga" icon={CalendarDays} items={upcoming} />
        <section className="space-y-4" id="manga-schedule">
          <h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays className="h-5 w-5 text-[#ff2f6d]" />Release Schedule</h2>
          <div className="grid gap-2 sm:grid-cols-2">{upcoming.slice(0, 8).map((manga) => <Link key={manga.id} href={`/manga/${manga.id}`} className="flex items-center gap-3 rounded-xl border border-white/7 bg-[#11141b] p-3 transition hover:border-[#ff2f6d]/40"><div className="relative h-16 w-11 shrink-0 overflow-hidden rounded"><Image src={manga.coverImage} alt="" fill sizes="44px" className="object-cover" /></div><div className="min-w-0"><p className="truncate text-sm font-bold">{mangaTitle(manga)}</p><p className="mt-1 text-xs text-[#ff2f6d]">{mangaDate(manga)}</p></div></Link>)}</div>
        </section>
      </main>
      <aside className="lg:col-span-3">
        <div className="sticky top-20 rounded-2xl border border-white/8 bg-[#11141b] p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Star className="h-5 w-5 text-amber-300" />Top 10 Manga</h2>
          <div className="space-y-2">{top.slice(0, 10).map((manga, index) => <Link key={manga.id} href={`/manga/${manga.id}`} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5"><span className={`w-6 text-center font-mono text-xs font-black ${index < 3 ? "text-[#ff2f6d]" : "text-white/35"}`}>{String(index + 1).padStart(2, "0")}</span><div className="relative h-16 w-11 shrink-0 overflow-hidden rounded"><Image src={manga.coverImage} alt="" fill sizes="44px" className="object-cover" /></div><div className="min-w-0"><p className="line-clamp-2 text-xs font-bold">{mangaTitle(manga)}</p><p className="mt-1 text-[10px] text-white/40">{manga.format || "MANGA"}{manga.score ? ` • ★ ${(manga.score / 10).toFixed(1)}` : ""}</p></div></Link>)}</div>
        </div>
      </aside>
    </div>
  </div>;
}
