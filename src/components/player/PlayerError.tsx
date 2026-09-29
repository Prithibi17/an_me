"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PlayerErrorProps {
  onRetry: () => void;
  message?: string;
}

export function PlayerError({ onRetry, message }: PlayerErrorProps) {
  return (
    <div className="w-full aspect-video rounded-xl bg-[#11151B] border border-white/10 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-[#F5F7FA] mb-1">
        Episode unavailable
      </h3>
      <p className="text-xs md:text-sm text-[#9CA3AF] max-w-sm mb-5 leading-relaxed">
        {message || "We couldn't load this episode from the playback provider. You can try refreshing or switching audio track."}
      </p>
      <Button
        variant="secondary"
        size="md"
        icon={<RefreshCw className="w-4 h-4" />}
        onClick={onRetry}
      >
        Try Again
      </Button>
    </div>
  );
}
