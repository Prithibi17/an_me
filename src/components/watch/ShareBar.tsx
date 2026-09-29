"use client";

import React, { useState } from "react";
import { Send, Radio, Share2, Check } from "lucide-react";

export function ShareBar({ animeTitle }: { animeTitle: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTwitter = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Watching ${animeTitle} on An:me!`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    }
  };

  const handleShareTelegram = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Watching ${animeTitle} on An:me!`);
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
    }
  };

  const handleShareReddit = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(`Watching ${animeTitle} on An:me!`);
      window.open(`https://reddit.com/submit?url=${url}&title=${title}`, "_blank");
    }
  };

  return (
    <div className="w-full bg-[#13151b] rounded-lg border border-white/5 p-3 flex flex-wrap items-center justify-between gap-4 select-none my-6">
      {/* Left: Mascot & Text */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-lg shadow-sm">
          👒
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white">Share Anime</span>
          <span className="text-[11px] text-white/50">to your friends</span>
        </div>
      </div>

      {/* Center: Share Count */}
      <div className="hidden sm:flex items-center text-xs font-black text-white/80">
        <span>540K Shares</span>
      </div>

      {/* Right: Share Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Twitter / X */}
        <button
          onClick={handleShareTwitter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1DA1F2] hover:bg-[#1a90d9] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <span className="font-mono text-xs">𝕏</span>
          <span>Share</span>
        </button>

        {/* Telegram */}
        <button
          onClick={handleShareTelegram}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#229ED9] hover:bg-[#1f8ec4] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Send className="w-3 h-3" />
          <span>Post</span>
        </button>

        {/* Facebook */}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              const url = encodeURIComponent(window.location.href);
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <span>f</span>
          <span>Share</span>
        </button>

        {/* Reddit */}
        <button
          onClick={handleShareReddit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FF4500] hover:bg-[#e03d00] text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Radio className="w-3 h-3" />
          <span>Reddit</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="p-2 rounded-md bg-[#22c55e] hover:bg-[#16a34a] text-white transition-colors cursor-pointer"
          title="Copy Link"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
