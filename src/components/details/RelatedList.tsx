import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Anime, RelationNode } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { AnimeCard } from "@/components/anime/AnimeCard";

interface RelatedListProps {
  relations?: RelationNode[];
  recommendations?: Anime[];
}

export function RelatedList({ relations, recommendations }: RelatedListProps) {
  const hasRelations = relations && relations.length > 0;
  const hasRecs = recommendations && recommendations.length > 0;

  if (!hasRelations && !hasRecs) {
    return (
      <div className="py-12 text-center text-xs md:text-sm text-[#9CA3AF]">
        No related anime or recommendations found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-4">
      {hasRelations && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-[#F5F7FA]">Franchise Relations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {relations.map((rel) => {
              const relTitle = getPreferredTitle(rel.title);
              const imgUrl = rel.coverImage?.large || rel.coverImage?.medium || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop";

              return (
                <Link
                  key={rel.id}
                  href={`/anime/${rel.id}/details`}
                  className="group flex flex-col gap-2 rounded-lg text-left"
                >
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-[#11151B] border border-white/5">
                    <Image
                      src={imgUrl}
                      alt={relTitle}
                      fill
                      sizes="180px"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[#866DFF] text-[10px] font-bold uppercase tracking-wider border border-white/10">
                        {rel.relationType.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#F5F7FA] group-hover:text-[#866DFF] truncate">
                      {relTitle}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF]">
                      {rel.format || "ANIME"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {hasRecs && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-[#F5F7FA]">Recommended Anime</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {recommendations.slice(0, 12).map((rec) => (
              <AnimeCard key={rec.id} anime={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
