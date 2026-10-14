"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, Columns3, Rows3 } from "lucide-react";
import type { KuhiMangaChapter, KuhiMangaSource } from "@/lib/kuhi/client";
import { cn } from "@/lib/utils";

interface MangaReaderProps {
  title: string;
  lookupTitle: string;
  pages: string[];
  currentChapterId: string;
  currentChapterNumber?: string;
  source: KuhiMangaSource;
  poster?: string | null;
  description?: string | null;
  chapters: KuhiMangaChapter[];
}

export function MangaReader({ title, lookupTitle, pages, currentChapterId, currentChapterNumber, source, poster, description, chapters }: MangaReaderProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"vertical" | "horizontal">("vertical");

  useEffect(() => {
    const saved = localStorage.getItem("kumo_manga_reader_mode");
    if (saved === "vertical" || saved === "horizontal") queueMicrotask(() => setMode(saved));
  }, []);

  function selectMode(value: "vertical" | "horizontal") {
    setMode(value);
    localStorage.setItem("kumo_manga_reader_mode", value);
  }

  function selectChapter(id: string) {
    const chapter = chapters.find((item) => item.id === id);
    if (!chapter || chapter.is_locked) return;
    router.push(`/manga/read/${encodeURIComponent(chapter.id)}?source=${source}&title=${encodeURIComponent(title)}&lookup=${encodeURIComponent(lookupTitle)}&chapter=${encodeURIComponent(chapter.number)}`);
  }

  const readable = chapters.filter((chapter) => !chapter.is_locked);
  const selectedChapterId = readable.find((chapter) => chapter.number === currentChapterNumber)?.id || currentChapterId;
  return <div className="mx-auto grid max-w-[1500px] gap-6 px-3 py-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
    <section className="min-w-0 rounded-xl border border-white/8 bg-[#08090c] p-2 sm:p-4">
      <div className={cn(
        mode === "vertical"
          ? "flex flex-col items-center gap-3"
          : "flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4"
      )}>
        {pages.map((src, index) => {
          const imageSrc = src.includes(".mangadex.network/") ? `/api/manga/image?url=${encodeURIComponent(src)}` : src;
          return <figure key={`${src}-${index}`} className={cn("relative shrink-0 overflow-hidden bg-black", mode === "vertical" ? "w-1/2 min-w-[280px] max-w-[520px]" : "w-[70vw] max-w-[760px] snap-center")}>
            <img src={imageSrc} alt={`${title} chapter ${currentChapterNumber || ""} page ${index + 1}`} loading={index < 2 ? "eager" : "lazy"} className="block h-auto w-full object-contain" />
            <figcaption className="absolute bottom-2 right-2 rounded bg-black/65 px-2 py-1 text-[10px] font-bold text-white/70">{index + 1} / {pages.length}</figcaption>
          </figure>;
        })}
      </div>
    </section>

    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#12141a]">
        <div className="flex gap-4 border-b border-white/8 p-4">
          {poster ? <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg"><Image src={poster} alt={title} fill sizes="96px" className="object-cover" /></div> : <div className="flex aspect-[2/3] w-24 shrink-0 items-center justify-center rounded-lg bg-white/5"><BookOpen className="h-7 w-7 text-white/20" /></div>}
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-[#ff2f6d]">Now reading</p><h1 className="mt-1 text-lg font-black leading-tight">{title}</h1><p className="mt-2 text-sm font-bold text-white/55">Chapter {currentChapterNumber || "—"}</p><p className="mt-2 line-clamp-4 text-xs leading-5 text-white/40">{description || "Select a chapter and choose your preferred reading direction."}</p></div>
        </div>

        <div className="space-y-4 p-4">
          <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/45">Chapter</span><select value={selectedChapterId} onChange={(event) => selectChapter(event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#0b0d12] px-3 py-2.5 text-sm font-bold outline-none focus:border-[#ff2f6d]">{readable.map((chapter) => <option key={chapter.id} value={chapter.id}>Chapter {chapter.number}{chapter.title && chapter.title !== `Chapter ${chapter.number}` ? ` — ${chapter.title}` : ""}</option>)}</select></label>

          <div><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/45">Reading layout</span><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => selectMode("vertical")} className={cn("flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-black", mode === "vertical" ? "border-[#ff2f6d] bg-[#ff2f6d] text-white" : "border-white/10 bg-white/5 text-white/55")}><Rows3 className="h-4 w-4" />Vertical</button><button type="button" onClick={() => selectMode("horizontal")} className={cn("flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-black", mode === "horizontal" ? "border-[#ff2f6d] bg-[#ff2f6d] text-white" : "border-white/10 bg-white/5 text-white/55")}><Columns3 className="h-4 w-4" />Horizontal</button></div></div>

          <p className="text-[11px] leading-5 text-white/35">Vertical keeps each page at half width with its natural aspect ratio. Horizontal places every page in one side-scrolling row.</p>
        </div>
      </div>
    </aside>
  </div>;
}
