"use client";

import { useCallback, useEffect, useState } from "react";
import type { Anime } from "@/lib/anilist/types";
import { AnimeSectionGrid } from "@/components/home/AnimeSectionGrid";

export function LiveLatestEpisodes({ initialItems }: { initialItems: Anime[] }) {
  const [items, setItems] = useState(initialItems);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/anime/latest?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = await response.json() as Anime[];
      if (next.length > 0) setItems(next);
    } catch {
      // Keep the last confirmed schedule when AniList is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    // Replace potentially stale ISR data as soon as the client hydrates. The
    // endpoint is uncached and already includes current provider availability.
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return <AnimeSectionGrid title="Latest Episodes" items={items} viewMoreHref="/search?view=latest" isLatestSection />;
}
