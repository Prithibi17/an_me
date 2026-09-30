"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Play, Clock, CheckCircle2, Calendar } from "lucide-react";
import { AiringScheduleItem } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { cn } from "@/lib/utils";

interface EstimatedScheduleProps {
  initialSchedules?: AiringScheduleItem[];
}

export function EstimatedSchedule({ initialSchedules = [] }: EstimatedScheduleProps) {
  const [schedules, setSchedules] = useState<AiringScheduleItem[]>(initialSchedules);
  const [isLoading, setIsLoading] = useState(initialSchedules.length === 0);

  // Generate 7 days for the schedule strip centered around today
  const days = useMemo(() => {
    const list: { day: string; date: string; dateStr: string; timestamp: number; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // From 3 days before today to 3 days after today
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayShort = d.toLocaleDateString(undefined, { weekday: "short" });
      const dateShort = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const dateStr = d.toDateString();

      list.push({
        day: dayShort,
        date: dateShort,
        dateStr,
        timestamp: Math.floor(d.getTime() / 1000),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toDateString();
  });

  // Calculate user timezone label (e.g. GMT+05:30)
  const timezoneStr = useMemo(() => {
    try {
      const offsetMinutes = -new Date().getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
      const mins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
      return `GMT${sign}${hours}:${mins}`;
    } catch {
      return "GMT";
    }
  }, []);

  // Fetch week schedule if initial was empty
  useEffect(() => {
    if (initialSchedules.length > 0) {
      setSchedules(initialSchedules);
      return;
    }

    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const start = days[0].timestamp;
        const end = days[days.length - 1].timestamp + 86400;
        const res = await fetch(`/api/schedule?start=${start}&end=${end}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setSchedules(data);
          }
        }
      } catch (err) {
        console.error("Failed to load schedule from API:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [days, initialSchedules]);

  // Current time for aired vs upcoming distinction
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter items for the selected day
  const itemsForSelectedDay = useMemo(() => {
    return schedules
      .filter((s) => {
        const itemDate = new Date(s.airingAt * 1000);
        return itemDate.toDateString() === selectedDateStr;
      })
      .sort((a, b) => a.airingAt - b.airingAt);
  }, [schedules, selectedDateStr]);

  return (
    <div className="w-full bg-[#13151b] rounded-lg border border-white/5 p-4 sm:p-5 flex flex-col gap-4 select-none my-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#ff2f6d]" />
          <h3 className="text-base font-black text-white">Estimated Schedule</h3>
          <span className="text-[10px] text-white/40 hidden sm:inline">• Real AniList Broadcast Data</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/70">
          ({timezoneStr})
        </span>
      </div>

      {/* Days Tabs Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {days.map((d) => {
          const isActive = selectedDateStr === d.dateStr;
          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDateStr(d.dateStr)}
              className={cn(
                "flex flex-col items-center min-w-[70px] sm:min-w-[85px] py-2 px-2 rounded-md transition-all cursor-pointer relative",
                isActive
                  ? "bg-[#ff2f6d] text-white font-extrabold shadow-sm shadow-[#ff2f6d]/20"
                  : "bg-[#181a24] hover:bg-[#222533] text-white/70"
              )}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold">{d.day}</span>
                {d.isToday && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff2f6d]" title="Today" />
                )}
              </div>
              <span className="text-[10px] opacity-80">{d.date}</span>
            </button>
          );
        })}
      </div>

      {/* Airing Timeline List */}
      <div className="flex flex-col divide-y divide-white/5 pt-1 min-h-[140px]">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-white/40 text-xs">
            <div className="w-5 h-5 border-2 border-[#ff2f6d] border-t-transparent rounded-full animate-spin" />
            <span>Loading broadcast schedule...</span>
          </div>
        ) : itemsForSelectedDay.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-1 text-white/40 text-xs">
            <Clock className="w-6 h-6 text-white/20 mb-1" />
            <span className="font-bold text-white/60">No scheduled broadcasts for this day</span>
            <span className="text-[11px] text-white/40">AniList has no verified airings recorded for this date.</span>
          </div>
        ) : (
          itemsForSelectedDay.map((item) => {
            const hasAired = item.airingAt <= nowSec;
            const itemDate = new Date(item.airingAt * 1000);
            const timeFormatted = itemDate.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            const title = getPreferredTitle(item.anime.title);

            // Compute remaining time if upcoming
            const diff = item.airingAt - nowSec;
            const diffHours = Math.floor(diff / 3600);
            const diffMins = Math.floor((diff % 3600) / 60);

            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 text-xs group hover:bg-white/5 -mx-2 px-2 rounded transition-colors"
              >
                {/* Time, Title & Format */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-white/50 text-xs shrink-0 w-11">
                    {timeFormatted}
                  </span>
                  <Link
                    href={`/anime/${item.anime.id}/details`}
                    className="font-bold text-white group-hover:text-[#ff2f6d] transition-colors truncate max-w-xs sm:max-w-md md:max-w-lg"
                  >
                    {title}
                  </Link>
                  <span className="px-1.5 py-0.2 rounded bg-white/5 text-white/40 text-[10px] hidden sm:inline">
                    {item.anime.format || "TV"}
                  </span>
                </div>

                {/* Episode Action / Status */}
                {hasAired ? (
                  <Link
                    href={`/anime/${item.anime.id}?ep=${item.episode}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e202c] hover:bg-[#ff2f6d] text-white/80 hover:text-white text-[11px] font-bold transition-colors shrink-0"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Episode {item.episode}</span>
                    <span className="text-[9px] px-1 rounded bg-[#22c55e]/20 text-[#22c55e] ml-0.5">
                      Aired
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-[#ff2f6d]/90 hidden md:inline">
                      {diffHours > 0 ? `in ${diffHours}h ${diffMins}m` : `in ${diffMins}m`}
                    </span>
                    <Link
                      href={`/anime/${item.anime.id}/details`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-semibold transition-colors"
                    >
                      <Clock className="w-2.5 h-2.5 text-[#ff2f6d]" />
                      <span>Episode {item.episode}</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
