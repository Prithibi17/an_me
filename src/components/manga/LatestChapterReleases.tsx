import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock3, BookMarked } from "lucide-react";
import type { ChapterRelease } from "@/lib/mangadex/client";

function releasedLabel(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function LatestChapterReleases({ releases }: { releases: ChapterRelease[] }) {
  if (!releases.length) return null;
  return <section className="space-y-4"><div><h2 className="flex items-center gap-2 text-lg font-black text-white sm:text-xl"><Clock3 className="h-5 w-5 text-[#ff2f6d]" />Latest Chapter Releases</h2><p className="mt-1 text-xs text-white/40">Verified English chapter releases, newest first.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{releases.map((release) => <Link key={release.id} href={`/manga/read/${encodeURIComponent(release.id)}?source=mangadex&title=${encodeURIComponent(release.title)}`} className="group flex min-w-0 gap-3 rounded-xl border border-white/8 bg-[#11141b] p-3 transition hover:-translate-y-0.5 hover:border-[#ff2f6d]/45"><div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-white/5">{release.coverImage ? <Image src={release.coverImage} alt="" fill sizes="64px" className="object-cover transition group-hover:scale-105" /> : <BookOpen className="absolute inset-0 m-auto h-6 w-6 text-white/20" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="rounded bg-[#ff2f6d]/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#ff5c8c]">{release.publicationType}</span><BookMarked className="h-3.5 w-3.5 text-white/25 group-hover:text-[#ff2f6d]" /></div><h3 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-white">{release.title}</h3><p className="mt-1 truncate text-xs font-bold text-[#ff2f6d]">{release.chapter ? `Chapter ${release.chapter}` : "New chapter"}{release.chapterTitle ? ` — ${release.chapterTitle}` : ""}</p><p className="mt-1 text-[10px] text-white/40">{releasedLabel(release.readableAt)} • English</p></div></Link>)}</div></section>;
}
