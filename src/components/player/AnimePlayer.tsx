"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowLeft,
  FastForward,
  SkipForward,
  Server,
} from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import {
  EpisodeItem,
  AVAILABLE_SERVERS,
  getPlaybackProvider,
} from "@/lib/providers";
import { saveWatchProgress } from "@/lib/storage/watch-history";
import { getPreferredTitle } from "@/lib/utils/title";
import { PlayerError } from "./PlayerError";
import { cn } from "@/lib/utils";

interface AnimePlayerProps {
  anime: Anime;
  currentEpisode: number;
  episodes: EpisodeItem[];
  onSelectEpisode: (epNum: number) => void;
  onClosePlayer?: () => void;
}

export function AnimePlayer({
  anime,
  currentEpisode,
  episodes,
  onSelectEpisode,
  onClosePlayer,
}: AnimePlayerProps) {
  const [selectedServer, setSelectedServer] = useState<string>("megaplay");
  const [track, setTrack] = useState<"sub" | "dub">("sub");

  useEffect(() => {
    try {
      const savedTrack = localStorage.getItem("kumo_preferred_track");
      if (savedTrack === "sub" || savedTrack === "dub") {
        setTrack(savedTrack);
      }
      const savedServer = localStorage.getItem("kumo_preferred_server");
      if (savedServer) {
        setSelectedServer(savedServer);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSelectTrack = (newTrack: "sub" | "dub") => {
    setTrack(newTrack);
    setHasError(false);
    setReloadKey((k) => k + 1);
    try {
      localStorage.setItem("kumo_preferred_track", newTrack);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectServer = (serverId: string) => {
    setSelectedServer(serverId);
    setHasError(false);
    setReloadKey((k) => k + 1);
    try {
      localStorage.setItem("kumo_preferred_server", serverId);
    } catch (e) {
      console.error(e);
    }
  };
  const [autoSkip, setAutoSkip] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const provider = getPlaybackProvider(selectedServer);
  const title = getPreferredTitle(anime.title);

  // Generate embed URL from current provider
  const embedUrl = provider.getEmbedUrl({
    source: "anilist",
    animeId: anime.id,
    episode: currentEpisode,
    track,
    accentColor: "7657FF",
    autoplay: true,
    asi: autoSkip,
    autonext: autoNext,
  });

  // PostMessage sender
  const send = useCallback((msg: Record<string, any>) => {
    iframeRef.current?.contentWindow?.postMessage(
      { channel: "zokoanime", ...msg },
      "*"
    );
  }, []);

  // PostMessage events listener for both Zokoanime and MegaPlay
  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = () => iframeRef.current;
    const active = () => document.fullscreenElement === wrap;
    const tell = () => {
      frame()?.contentWindow?.postMessage(
        { channel: "zokoanime", type: "fullscreen", active: active() },
        "*"
      );
    };

    document.addEventListener("fullscreenchange", tell);
    const iframeEl = frame();
    iframeEl?.addEventListener("load", tell);

    function handleMessage(event: MessageEvent) {
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data) return;

      // 1. Zokoanime events
      if (data.channel === "zokoanime") {
        switch (data.type) {
          case "ready":
            tell();
            break;
          case "fullscreen":
            if (data.request === "enter" && wrap) {
              wrap.requestFullscreen().then(tell, tell).catch(tell);
            } else if (data.request === "exit") {
              document.exitFullscreen().then(tell, tell).catch(tell);
            }
            break;
          case "watching-log":
          case "time": {
            const current = data.currentTime || data.position || 0;
            const dur = data.duration || 1440;
            if (dur > 0) {
              saveWatchProgress({
                animeId: anime.id,
                animeTitle: title,
                coverImage: anime.coverImage,
                bannerImage: anime.bannerImage,
                episode: currentEpisode,
                episodeTitle: "Episode " + currentEpisode,
                currentTime: current,
                duration: dur,
              });
            }
            break;
          }
          case "ended":
            if (data.auto_next) {
              const nextEp = currentEpisode + 1;
              if (episodes.some((e) => e.number === nextEp)) {
                onSelectEpisode(nextEp);
              }
            }
            break;
          case "error":
            if (data.reason !== "sandboxed") {
              setHasError(true);
            }
            break;
        }
      }

      // 2. MegaPlay / MegaCloud events
      if (data.channel === "megacloud" || data.type === "watching-log" || data.event) {
        if (data.event === "complete") {
          const nextEp = currentEpisode + 1;
          if (episodes.some((e) => e.number === nextEp)) {
            onSelectEpisode(nextEp);
          }
        }
        if (data.event === "time" || data.type === "watching-log") {
          const current = data.time || data.currentTime || 0;
          const dur = data.duration || 1440;
          if (dur > 0) {
            saveWatchProgress({
              animeId: anime.id,
              animeTitle: title,
              coverImage: anime.coverImage,
              bannerImage: anime.bannerImage,
              episode: currentEpisode,
              episodeTitle: "Episode " + currentEpisode,
              currentTime: current,
              duration: dur,
            });
          }
        }
        if (data.event === "error") {
          setHasError(true);
        }
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("fullscreenchange", tell);
      iframeEl?.removeEventListener("load", tell);
      window.removeEventListener("message", handleMessage);
    };
  }, [anime.id, anime.coverImage, anime.bannerImage, title, currentEpisode, episodes, onSelectEpisode]);

  // Fullscreen tracker
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(document.fullscreenElement === wrapRef.current);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (!document.fullscreenElement) {
      wrap.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const currentEpItem = episodes.find((e) => e.number === currentEpisode);
  const prevEp = currentEpisode > 1 ? currentEpisode - 1 : null;
  const nextEp = episodes.some((e) => e.number === currentEpisode + 1) ? currentEpisode + 1 : null;

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onClosePlayer && (
            <button
              onClick={onClosePlayer}
              className="p-1.5 rounded-lg bg-[#11151B] border border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex flex-col">
            <h2 className="text-sm md:text-base font-bold text-[#F5F7FA] truncate max-w-xs sm:max-w-md">
              {title}
            </h2>
            <span className="text-xs text-[#7657FF] font-semibold">
              Episode {currentEpisode} {currentEpItem?.title ? "• " + currentEpItem.title : ""}
            </span>
          </div>
        </div>

        {/* Server & Audio Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Server Switcher: Server 1 vs Server 2 */}
          <div className="flex items-center rounded-lg bg-[#11151B] border border-white/10 p-0.5 text-xs font-semibold">
            <span className="hidden sm:flex items-center gap-1 px-2 text-[#6B7280]">
              <Server className="w-3 h-3" />
            </span>
            {AVAILABLE_SERVERS.map((srv) => {
              const isActive = selectedServer === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => handleSelectServer(srv.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-colors text-xs font-semibold cursor-pointer",
                    isActive
                      ? "bg-[#7657FF] text-white shadow-sm"
                      : "text-[#9CA3AF] hover:text-[#F5F7FA]"
                  )}
                >
                  <span>{srv.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sub / Dub Selector: Two Options */}
          <div className="flex items-center rounded-lg bg-[#11151B] border border-white/10 p-0.5 text-xs font-bold">
            {(["sub", "dub"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleSelectTrack(t)}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors uppercase tracking-wider text-xs cursor-pointer",
                  track === t
                    ? "bg-[#7657FF] text-white shadow-sm"
                    : "text-[#9CA3AF] hover:text-[#F5F7FA]"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded-lg bg-[#11151B] border border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Container (id="player-wrap" for fullscreen across episodes) */}
      <div
        id="player-wrap"
        ref={wrapRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl"
      >
        {hasError ? (
          <PlayerError
            onRetry={() => {
              setHasError(false);
              setReloadKey((k) => k + 1);
            }}
            message="This episode stream is currently unavailable on this server. Try switching to the other server above or switching audio language."
          />
        ) : (
          <iframe
            key={selectedServer + "-" + currentEpisode + "-" + track + "-" + reloadKey}
            ref={iframeRef}
            src={embedUrl}
            width="100%"
            height="100%"
            allow="fullscreen; autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>

      {/* Episode Controls Below Video */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          disabled={!prevEp}
          onClick={() => prevEp && onSelectEpisode(prevEp)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161B22] border border-white/10 hover:border-white/20 text-xs font-semibold text-[#F5F7FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Episode {prevEp || "-"}</span>
        </button>

        <span className="text-xs text-[#9CA3AF] font-medium hidden sm:inline">
          Episode {currentEpisode} of {episodes.length}
        </span>

        <button
          disabled={!nextEp}
          onClick={() => nextEp && onSelectEpisode(nextEp)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#7657FF] hover:bg-[#866DFF] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-[#7657FF]/20 cursor-pointer"
        >
          <span>Episode {nextEp || "-"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Episode Grid Selector: [01][02][03]... */}
      <div className="flex flex-col gap-2 pt-2">
        <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
          Quick Episode Select
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          {episodes.map((ep) => {
            const isActive = ep.number === currentEpisode;
            return (
              <button
                key={ep.number}
                onClick={() => onSelectEpisode(ep.number)}
                className={cn(
                  "w-10 h-8 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer",
                  isActive
                    ? "bg-[#7657FF] text-white border border-[#7657FF]"
                    : "bg-[#11151B] hover:bg-[#161B22] text-[#9CA3AF] hover:text-[#F5F7FA] border border-white/5"
                )}
              >
                {String(ep.number).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
