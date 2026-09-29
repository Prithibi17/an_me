"use client";

import { useEffect, useState } from "react";
import { getWatchHistory, WatchProgress } from "../lib/storage/watch-history";

export function useWatchHistory(): { history: WatchProgress[]; isLoading: boolean } {
  const [history, setHistory] = useState<WatchProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function load() {
      setHistory(getWatchHistory());
      setIsLoading(false);
    }

    load();

    window.addEventListener("kumo_history_updated", load);
    window.addEventListener("storage", load);

    return () => {
      window.removeEventListener("kumo_history_updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return { history, isLoading };
}
