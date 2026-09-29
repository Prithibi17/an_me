"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar, AlertCircle } from "lucide-react";
import { NextAiringEpisode } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

interface UpcomingCountdownProps {
  nextAiringEpisode?: NextAiringEpisode | null;
  compact?: boolean;
  className?: string;
}

export function UpcomingCountdown({
  nextAiringEpisode,
  compact = false,
  className,
}: UpcomingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    hasAired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!nextAiringEpisode || !nextAiringEpisode.airingAt) return;

    function calculate() {
      const now = Math.floor(Date.now() / 1000);
      const diff = nextAiringEpisode!.airingAt - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          hasAired: true,
        });
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        hasAired: false,
      });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [nextAiringEpisode]);

  // If no confirmed schedule
  if (!nextAiringEpisode || !nextAiringEpisode.airingAt) {
    if (compact) {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold text-white/40",
            className
          )}
        >
          <AlertCircle className="w-2.5 h-2.5 text-amber-400/70" />
          <span>Schedule not announced</span>
        </span>
      );
    }

    return (
      <div
        className={cn(
          "w-full rounded-lg bg-[#181a24] border border-amber-500/20 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-white/70",
          className
        )}
      >
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-amber-300">Schedule not announced</span>
          <span className="text-[11px] text-white/50">
            AniList has not confirmed the release schedule for upcoming episodes yet.
          </span>
        </div>
      </div>
    );
  }

  // Format localized air date
  const airDate = new Date(nextAiringEpisode.airingAt * 1000);
  const formattedDate = airDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = airDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (compact) {
    if (timeLeft?.hasAired) {
      return (
        <span className={cn("text-[10px] font-bold text-[#22c55e]", className)}>
          Ep {nextAiringEpisode.episode} Aired
        </span>
      );
    }
    const daysStr = timeLeft && timeLeft.days > 0 ? `${timeLeft.days}d ` : "";
    const hoursStr = timeLeft ? `${timeLeft.hours}h` : "";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-bold text-[#ff5c8a]",
          className
        )}
      >
        <Clock className="w-2.5 h-2.5" />
        <span>
          Ep {nextAiringEpisode.episode}: {daysStr}{hoursStr || `${timeLeft?.minutes || 0}m`}
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-lg bg-gradient-to-r from-[#181a24] to-[#14161f] border border-[#ff5c8a]/20 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs",
        className
      )}
    >
      {/* Left: Episode info & Air Date */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#ff5c8a]/15 text-[#ff5c8a] font-extrabold text-[11px] uppercase tracking-wide">
            Upcoming Episode {nextAiringEpisode.episode}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-[11px] font-medium mt-0.5">
          <Calendar className="w-3.5 h-3.5 text-white/40" />
          <span>
            {formattedDate} at {formattedTime}
          </span>
        </div>
      </div>

      {/* Right: Live Ticking Countdown */}
      {timeLeft?.hasAired ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#22c55e]/20 text-[#22c55e] font-bold text-xs">
          <span>Airing Now / Freshly Released</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 font-mono select-none">
          <div className="flex flex-col items-center bg-[#0e1017] px-2.5 py-1.5 rounded border border-white/5 min-w-[42px]">
            <span className="text-sm font-black text-white">
              {String(timeLeft?.days || 0).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase text-white/40 font-sans font-bold">
              Days
            </span>
          </div>
          <span className="text-white/40 font-bold">:</span>
          <div className="flex flex-col items-center bg-[#0e1017] px-2.5 py-1.5 rounded border border-white/5 min-w-[42px]">
            <span className="text-sm font-black text-white">
              {String(timeLeft?.hours || 0).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase text-white/40 font-sans font-bold">
              Hours
            </span>
          </div>
          <span className="text-white/40 font-bold">:</span>
          <div className="flex flex-col items-center bg-[#0e1017] px-2.5 py-1.5 rounded border border-white/5 min-w-[42px]">
            <span className="text-sm font-black text-white">
              {String(timeLeft?.minutes || 0).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase text-white/40 font-sans font-bold">
              Mins
            </span>
          </div>
          <span className="text-white/40 font-bold">:</span>
          <div className="flex flex-col items-center bg-[#0e1017] px-2.5 py-1.5 rounded border border-white/5 min-w-[42px]">
            <span className="text-sm font-black text-[#ff5c8a]">
              {String(timeLeft?.seconds || 0).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase text-white/40 font-sans font-bold">
              Secs
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
