"use client";

import React from "react";
import { Anime } from "@/lib/anilist/types";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

interface SearchResultsProps {
  results: Anime[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  totalResults?: number;
  query?: string;
  onLoadMore: () => void;
  onClearFilters: () => void;
}

export function SearchResults({
  results,
  isLoading,
  isLoadingMore,
  hasNextPage,
  totalResults,
  query,
  onLoadMore,
  onClearFilters,
}: SearchResultsProps) {
  // Skeleton Grid during initial load
  if (isLoading && results.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 18 }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty State
  if (!isLoading && results.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center text-2xl mb-4">
          🔍
        </div>
        <h3 className="text-xl font-bold text-[#F5F7FA] mb-2">No anime found</h3>
        <p className="text-sm text-[#9CA3AF] max-w-md mb-6 leading-relaxed">
          {query
            ? `We couldn't find anything matching "${query}". Try another title or remove some filters.`
            : "No anime matched the selected filters. Try broadening your search."}
        </p>
        <Button variant="secondary" size="md" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs md:text-sm text-[#9CA3AF]">
        <span>
          {query ? (
            <>
              Results for <strong className="text-[#F5F7FA]">"{query}"</strong>
            </>
          ) : (
            "Explore anime"
          )}
        </span>
        {totalResults !== undefined && (
          <span className="font-medium text-[#6B7280]">
            {totalResults.toLocaleString()} results
          </span>
        )}
      </div>

      {/* Responsive Grid: 2 cols mobile, 3-4 tablet, 5 laptop, 6 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {results.map((anime, idx) => (
          <AnimeCard
            key={anime.id + "-" + idx}
            anime={anime}
            priority={idx < 6}
          />
        ))}
      </div>

      {/* Pagination: Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-4 pb-12">
          <Button
            variant="secondary"
            size="lg"
            isLoading={isLoadingMore}
            onClick={onLoadMore}
            className="px-8"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
