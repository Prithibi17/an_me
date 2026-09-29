"use client";

import React from "react";
import { MessageSquareText } from "lucide-react";

export function NoticeBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-[#21162d] via-[#1a1b26] to-[#161822] rounded-lg border border-[#ff5c8a]/20 p-4 flex items-center gap-3.5 my-4 select-none">
      <div className="w-9 h-9 rounded-full bg-[#ff5c8a]/20 flex items-center justify-center shrink-0 text-[#ff5c8a]">
        <MessageSquareText className="w-4 h-4" />
      </div>
      <p className="text-xs text-white/80 leading-relaxed">
        Please remember that you can always resume your watching progress or access your bookmarked series by visiting the <strong className="text-white">Watch List</strong>. Enjoy fast, HD anime streaming on An:me with SUB & DUB!
      </p>
    </div>
  );
}
