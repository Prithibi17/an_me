"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type DetailTab = "overview" | "episodes" | "characters" | "related";

interface DetailsTabsProps {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
  episodeCount?: number;
  characterCount?: number;
  relatedCount?: number;
}

export function DetailsTabs({
  activeTab,
  onChange,
  episodeCount,
  characterCount,
  relatedCount,
}: DetailsTabsProps) {
  const tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "episodes", label: "Episodes", count: episodeCount },
    { id: "characters", label: "Characters", count: characterCount },
    { id: "related", label: "Related", count: relatedCount },
  ];

  return (
    <div className="w-full border-b border-white/10 select-none">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative py-3.5 text-sm font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer",
                isActive
                  ? "text-[#F5F7FA]"
                  : "text-[#9CA3AF] hover:text-[#F5F7FA]"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive
                      ? "bg-[#7c3cff]/30 text-[#9066ff]"
                      : "bg-[#161B22] text-[#6B7280]"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7c3cff] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
