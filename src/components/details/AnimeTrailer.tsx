import { Play } from "lucide-react";
import type { Anime } from "@/lib/anilist/types";

export function AnimeTrailer({ trailer }: { trailer: Anime["trailer"] }) {
  if (!trailer?.youtubeId) {
    return (
      <section className="mt-5 rounded-xl border border-white/10 bg-[#11151B] px-5 py-6">
        <h2 className="font-extrabold text-white">Official Trailer</h2>
        <p className="mt-1 text-sm text-white/45">No verified trailer is available for this anime season yet.</p>
      </section>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#11151B] shadow-[0_18px_50px_rgba(0,0,0,.22)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ff2f6d]/15 text-[#ff2f6d]">
          <Play className="h-4 w-4 fill-current" />
        </span>
        <div className="min-w-0">
          <h2 className="font-extrabold text-white">Official Trailer</h2>
          <p className="truncate text-xs text-white/45">{trailer.name}</p>
        </div>
      </div>
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.youtubeId)}?rel=0&modestbranding=1`}
          title={trailer.name}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}
