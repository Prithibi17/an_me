"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Maximize2,
  Minimize2,
  Lightbulb,
  Play,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Flag,
  Search,
  Subtitles,
  Mic,
  Download,
  Star,
  MessageSquare,
  ThumbsDown,
  Smile,
  Sparkles,
} from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { EpisodeItem, AVAILABLE_SERVERS, getPlaybackProvider } from "@/lib/providers";
import { choosePlaybackServer, nextPlaybackServer } from "@/lib/providers/decision";
import { saveWatchProgress } from "@/lib/storage/watch-history";
import { isAnimeInList, toggleAnimeInList } from "@/lib/storage/anime-list";
import { useAnimeNameLanguage } from "@/lib/storage/language";
import { getPreferredTitle } from "@/lib/utils/title";
import { PlayerError } from "./PlayerError";
import { UpcomingCountdown } from "@/components/common/UpcomingCountdown";
import { cn } from "@/lib/utils";
import { useWatchTogether, type RoomControl } from "@/hooks/useWatchTogether";
import { WatchTogetherPanel } from "@/components/watch2gether/WatchTogetherPanel";

interface HiAnimePlayerProps {
  anime: Anime;
  currentEpisode: number;
  episodes: EpisodeItem[];
  onSelectEpisode: (epNum: number) => void;
  isLightOff: boolean;
  onToggleLight: () => void;
  partyCode?: string | null;
}

type AnikotoSource = {
  provider: "anikoto";
  serverName: "Server 3";
  episode: number;
  title: string;
  subUrl: string | null;
  dubUrl: string | null;
};

export function HiAnimePlayer({
  anime,
  currentEpisode,
  episodes,
  onSelectEpisode,
  isLightOff,
  onToggleLight,
  partyCode = null,
}: HiAnimePlayerProps) {
  const [selectedServer, setSelectedServer] = useState<string>("megaplay");
  const [track, setTrack] = useState<"sub" | "dub">("sub");
  const [availability, setAvailability] = useState<{ sub: number[]; dub: number[] } | null>(null);
  const [anikotoSource, setAnikotoSource] = useState<AnikotoSource | null>(null);
  const [isAnikotoLoading, setIsAnikotoLoading] = useState(false);
  const preferredServerRef = useRef<string | null>(null);
  const confirmedSubCount = Math.max(anime.subEpisodeCount || 0, availability?.sub.length || 0);
  const confirmedDubCount = Math.max(anime.dubEpisodeCount || 0, availability?.dub.length || 0);
  const currentDubAvailable = Boolean(
    confirmedDubCount >= currentEpisode || availability?.dub.includes(currentEpisode) || anikotoSource?.dubUrl
  );

  useEffect(() => {
    let active = true;
    setIsAnikotoLoading(true);
    setAnikotoSource(null);
    fetch(`/api/anikoto/episode?animeId=${anime.id}&episode=${currentEpisode}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => {
        if (!active) return;
        const source = result.source as AnikotoSource | null;
        setAnikotoSource(source);
        const sourceForTrack = Boolean(track === "dub" ? source?.dubUrl : source?.subUrl);
        setSelectedServer(choosePlaybackServer(preferredServerRef.current, sourceForTrack));
      })
      .catch(() => {
        if (active) {
          setAnikotoSource(null);
          setSelectedServer(choosePlaybackServer(preferredServerRef.current, false));
        }
      })
      .finally(() => { if (active) setIsAnikotoLoading(false); });
    return () => { active = false; };
  }, [anime.id, currentEpisode, track]);

  useEffect(() => {
    if (episodes.length === 0) { setAvailability({ sub: [], dub: [] }); return; }
    let active = true;
    setAvailability(null);
    fetch(`/api/anime/availability?animeId=${anime.id}&count=${episodes.length}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => { if (active) setAvailability(result); })
      .catch(() => { if (active) setAvailability({ sub: episodes.map((episode) => episode.number), dub: [] }); });
    return () => { active = false; };
  }, [anime.id, episodes]);

  useEffect(() => {
    if (availability && track === "dub" && !currentDubAvailable) setTrack("sub");
  }, [availability, currentDubAvailable, track, currentEpisode]);

  // Load persistent track & server preference from localStorage
  useEffect(() => {
    try {
      const savedTrack = localStorage.getItem("kumo_preferred_track");
      if (savedTrack === "sub" || savedTrack === "dub") {
        setTrack(savedTrack);
      }
      const savedServer = localStorage.getItem("kumo_preferred_server");
      preferredServerRef.current = savedServer;
      if (savedServer) {
        setSelectedServer(savedServer);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSelectTrack = useCallback((newTrack: "sub" | "dub") => {
    if (newTrack === "dub" && !currentDubAvailable) return;
    if (selectedServer === "anikoto" && !(newTrack === "dub" ? anikotoSource?.dubUrl : anikotoSource?.subUrl)) return;
    setTrack(newTrack);
    setHasError(false);
    setReloadKey((k) => k + 1);
    try {
      localStorage.setItem("kumo_preferred_track", newTrack);
    } catch (e) {
      console.error(e);
    }
  }, [anikotoSource, currentDubAvailable, selectedServer]);

  const handleSelectServer = useCallback((serverId: string, forcedTrack?: "sub" | "dub") => {
    if (forcedTrack === "dub" && !currentDubAvailable) return;
    setSelectedServer(serverId);
    preferredServerRef.current = serverId;
    if (forcedTrack) {
      setTrack(forcedTrack);
      try {
        localStorage.setItem("kumo_preferred_track", forcedTrack);
      } catch (e) {
        console.error(e);
      }
    }
    setHasError(false);
    setReloadKey((k) => k + 1);
    try {
      localStorage.setItem("kumo_preferred_server", serverId);
    } catch (e) {
      console.error(e);
    }
  }, [anikotoSource, currentDubAvailable]);

  const [langPreference] = useAnimeNameLanguage();
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [autoNext, setAutoNext] = useState<boolean>(false);
  const [autoSkipIntro, setAutoSkipIntro] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [epFilter, setEpFilter] = useState<string>("");
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>("Video buffering or not playing");
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [votesCount, setVotesCount] = useState({ boring: 4, great: 42, amazing: 189 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const epListRef = useRef<HTMLDivElement>(null);

  const title = getPreferredTitle(anime.title, langPreference);
  const synopsis = anime.description
    ? anime.description.replace(/<[^>]*>/g, "")
    : "No summary available for this title.";
  const provider = getPlaybackProvider(selectedServer);

  // Sync bookmark and playback options from localStorage
  useEffect(() => {
    setIsBookmarked(isAnimeInList(anime.id));
    try {
      const savedAutoPlay = localStorage.getItem("kumo_autoplay");
      if (savedAutoPlay !== null) setAutoPlay(savedAutoPlay === "true");
      const savedAutoNext = localStorage.getItem("kumo_autonext");
      if (savedAutoNext !== null) setAutoNext(savedAutoNext === "true");
      const savedAutoSkip = localStorage.getItem("kumo_autoskipintro");
      if (savedAutoSkip !== null) setAutoSkipIntro(savedAutoSkip === "true");
    } catch (e) {
      console.error(e);
    }
  }, [anime.id]);

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kumo_autoplay", String(next));
      } catch {}
      return next;
    });
    setReloadKey((k) => k + 1);
  };

  const toggleAutoNext = () => {
    setAutoNext((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kumo_autonext", String(next));
      } catch {}
      return next;
    });
  };

  const toggleAutoSkipIntro = () => {
    setAutoSkipIntro((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kumo_autoskipintro", String(next));
      } catch {}
      return next;
    });
    setReloadKey((k) => k + 1);
  };

  // Handle bookmark toggle
  const handleToggleBookmark = () => {
    const updated = toggleAnimeInList({
      animeId: anime.id,
      title: title,
      coverImage: anime.coverImage,
      score: anime.score,
      format: anime.format,
      year: anime.seasonYear,
    });
    setIsBookmarked(updated);
    setToastMessage(updated ? "Added to Watchlist!" : "Removed from Watchlist!");
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Generate embed URL from current provider
  const embedUrl = selectedServer === "anikoto"
    ? (track === "dub" ? anikotoSource?.dubUrl : anikotoSource?.subUrl) || ""
    : provider.getEmbedUrl({
        source: "anilist",
        animeId: anime.id,
        episode: currentEpisode,
        track,
        accentColor: "ff5c8a",
        autoplay: autoPlay,
        asi: autoSkipIntro,
        autonext: autoNext,
      });

  const tryNextServer = useCallback(() => {
    const hasChineseSource = Boolean(track === "dub" ? anikotoSource?.dubUrl : anikotoSource?.subUrl);
    const next = nextPlaybackServer(selectedServer, hasChineseSource);
    setSelectedServer(next);
    preferredServerRef.current = next;
    setHasError(false);
    setReloadKey((key) => key + 1);
    try { localStorage.setItem("kumo_preferred_server", next); } catch {}
  }, [anikotoSource, selectedServer, track]);

  // PostMessage sender
  const send = useCallback((msg: Record<string, any>) => {
    iframeRef.current?.contentWindow?.postMessage(
      { channel: "zokoanime", ...msg },
      "*"
    );
  }, []);

  const playbackRef = useRef({ currentTime: 0, playing: false, lastSync: 0 });
  const pendingControlRef = useRef<RoomControl | null>(null);

  const applyRemoteControl = useCallback((control: RoomControl) => {
    if (control.episode && control.episode !== currentEpisode) {
      pendingControlRef.current = control;
      onSelectEpisode(control.episode);
      return;
    }
    const currentTime = Math.max(0, control.currentTime || 0);
    const shouldChangePlayback = control.action !== "sync" || playbackRef.current.playing !== control.playing;
    const zokoType = control.action === "sync" ? (control.playing ? "play" : "pause") : control.action;
    if (shouldChangePlayback && control.action !== "seek") {
      send({ type: zokoType, currentTime, position: currentTime, playing: control.playing });
      iframeRef.current?.contentWindow?.postMessage({ channel: "megacloud", event: zokoType, time: currentTime, playing: control.playing }, "*");
      playbackRef.current.playing = control.playing;
    }
    const drift = Math.abs(playbackRef.current.currentTime - currentTime);
    if (control.action === "seek" || (control.action === "sync" && drift > 2.5)) {
      send({ type: "seek", currentTime, position: currentTime });
      iframeRef.current?.contentWindow?.postMessage({ channel: "megacloud", event: "seek", time: currentTime }, "*");
      playbackRef.current.currentTime = currentTime;
    }
  }, [currentEpisode, onSelectEpisode, send]);

  const watchTogether = useWatchTogether(partyCode, applyRemoteControl);

  useEffect(() => {
    const pending = pendingControlRef.current;
    if (!pending || pending.episode !== currentEpisode) return;
    const timer = window.setTimeout(() => {
      pendingControlRef.current = null;
      applyRemoteControl({ ...pending, action: "sync" });
    }, 900);
    return () => clearTimeout(timer);
  }, [currentEpisode, applyRemoteControl]);

  const selectEpisode = useCallback((episode: number) => {
    if (watchTogether.isHost) watchTogether.sendControl({ action: "episode", episode, currentTime: 0, playing: false });
    onSelectEpisode(episode);
  }, [onSelectEpisode, watchTogether.isHost, watchTogether.sendControl]);

  // PostMessage events listener for Zokoanime & MegaPlay
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
            playbackRef.current.currentTime = current;
            if (typeof data.playing === "boolean") playbackRef.current.playing = data.playing;
            if (watchTogether.isHost && Date.now() - playbackRef.current.lastSync > 5000) {
              playbackRef.current.lastSync = Date.now();
              watchTogether.sendControl({ action: "sync", currentTime: current, playing: playbackRef.current.playing, episode: currentEpisode });
            }
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
          case "play":
          case "playing":
            playbackRef.current.playing = true;
            if (watchTogether.isHost) watchTogether.sendControl({ action: "play", currentTime: playbackRef.current.currentTime, playing: true, episode: currentEpisode });
            break;
          case "pause":
          case "paused":
            playbackRef.current.playing = false;
            if (watchTogether.isHost) watchTogether.sendControl({ action: "pause", currentTime: playbackRef.current.currentTime, playing: false, episode: currentEpisode });
            break;
          case "seek":
          case "seeked": {
            const current = data.currentTime || data.position || 0;
            playbackRef.current.currentTime = current;
            if (watchTogether.isHost) watchTogether.sendControl({ action: "seek", currentTime: current, playing: playbackRef.current.playing, episode: currentEpisode });
            break;
          }
          case "ended":
            if (autoNext || data.auto_next) {
              const next = currentEpisode + 1;
              if (episodes.some((e) => e.number === next)) {
                selectEpisode(next);
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

      // 2. MegaPlay events
      if (data.channel === "megacloud" || data.type === "watching-log" || data.event) {
        if (data.event === "complete") {
          const next = currentEpisode + 1;
          if (episodes.some((e) => e.number === next)) {
            selectEpisode(next);
          }
        }
        if (data.event === "time" || data.type === "watching-log") {
          const current = data.time || data.currentTime || 0;
          const dur = data.duration || 1440;
          playbackRef.current.currentTime = current;
          if (typeof data.playing === "boolean") playbackRef.current.playing = data.playing;
          if (watchTogether.isHost && Date.now() - playbackRef.current.lastSync > 5000) {
            playbackRef.current.lastSync = Date.now();
            watchTogether.sendControl({ action: "sync", currentTime: current, playing: playbackRef.current.playing, episode: currentEpisode });
          }
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
        if (data.event === "play" || data.event === "playing") {
          playbackRef.current.playing = true;
          if (watchTogether.isHost) watchTogether.sendControl({ action: "play", currentTime: playbackRef.current.currentTime, playing: true, episode: currentEpisode });
        }
        if (data.event === "pause" || data.event === "paused") {
          playbackRef.current.playing = false;
          if (watchTogether.isHost) watchTogether.sendControl({ action: "pause", currentTime: playbackRef.current.currentTime, playing: false, episode: currentEpisode });
        }
        if (data.event === "seek" || data.event === "seeked") {
          const current = data.time || data.currentTime || 0;
          playbackRef.current.currentTime = current;
          if (watchTogether.isHost) watchTogether.sendControl({ action: "seek", currentTime: current, playing: playbackRef.current.playing, episode: currentEpisode });
        }
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("fullscreenchange", tell);
      iframeEl?.removeEventListener("load", tell);
      window.removeEventListener("message", handleMessage);
    };
  }, [anime.id, anime.coverImage, anime.bannerImage, title, currentEpisode, episodes, autoNext, selectEpisode, watchTogether.isHost, watchTogether.sendControl]);

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

  // Scroll active episode into view on episode change
  useEffect(() => {
    if (epListRef.current) {
      const activeEl = epListRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [currentEpisode]);

  // Filter episodes by number
  const filteredEpisodes = useMemo(() => {
    if (!epFilter.trim()) return episodes;
    return episodes.filter(
      (ep) =>
        String(ep.number).includes(epFilter.trim()) ||
        (ep.title && ep.title.toLowerCase().includes(epFilter.trim().toLowerCase()))
    );
  }, [episodes, epFilter]);

  const prevEp = currentEpisode > 1 ? currentEpisode - 1 : null;
  const nextEp = episodes.some((e) => e.number === currentEpisode + 1) ? currentEpisode + 1 : null;

  const handleVoteReaction = (type: "boring" | "great" | "amazing") => {
    setSelectedReaction(type);
    setVotesCount((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  };

  const animeScore = anime.score ? (anime.score / 10).toFixed(1) : "8.5";

  return (
    <div className={cn("w-full select-none transition-all duration-300", isExpanded && "max-w-none")}>
      {/* 3-Column Top Theater Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ========================================================================= */}
        {/* COLUMN 1 (LEFT): EPISODE LIST SIDEBAR (~3 cols on desktop) */}
        {/* ========================================================================= */}
        <div className="order-2 lg:order-1 lg:col-span-3 xl:col-span-2 bg-[#13151b] rounded-xl lg:rounded-lg border border-white/5 flex flex-col h-auto lg:h-[580px] overflow-hidden">
          {/* Header & Filter */}
          <div className="p-3 sm:p-4 lg:p-3 border-b border-white/5 flex flex-col gap-2 shrink-0 bg-[#161822]">
            <span className="text-lg lg:text-xs font-black lg:font-bold text-white/90 lg:uppercase lg:tracking-wider">
              <span className="lg:hidden">Episodes</span>
              <span className="hidden lg:inline">List of episodes:</span>
            </span>
            <div className="relative hidden lg:flex items-center">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={epFilter}
                onChange={(e) => setEpFilter(e.target.value)}
                placeholder="Number of Ep"
                className="w-full h-8 pl-8 pr-2.5 rounded bg-[#0e1015] border border-white/5 focus:border-[#ff2f6d]/50 focus:outline-none text-xs text-white placeholder-white/40 transition-colors"
              />
            </div>
          </div>

          {/* Scrollable Episode Items */}
          <div
            ref={epListRef}
            className="grid grid-cols-6 lg:block flex-1 lg:overflow-y-auto gap-2 lg:gap-0 lg:divide-y lg:divide-white/5 p-3 sm:p-4 lg:p-1 text-xs"
          >
            {episodes.length === 0 ? (
              <div className="p-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-white/50 h-full">
                <span className="font-bold text-white/70">No Aired Episodes</span>
                <span className="text-[11px] text-white/40">
                  {anime.nextAiringEpisode
                    ? `Upcoming Episode ${anime.nextAiringEpisode.episode} confirmed on AniList.`
                    : "Schedule not announced on AniList."}
                </span>
              </div>
            ) : filteredEpisodes.length === 0 ? (
              <div className="p-4 text-center text-xs text-white/40">
                No episodes found
              </div>
            ) : (
              filteredEpisodes.map((ep) => {
                const isActive = ep.number === currentEpisode;
                return (
                  <button
                    key={ep.number}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => selectEpisode(ep.number)}
                    className={cn(
                      "w-full min-h-11 lg:min-h-0 justify-center lg:justify-start text-center lg:text-left px-2 lg:px-3 py-2.5 rounded-lg lg:rounded flex items-center gap-1 lg:gap-3 border lg:border-0 border-white/10 transition-colors cursor-pointer group",
                      isActive
                        ? "bg-[#ff4f86] text-[#111] font-bold shadow-sm"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span
                      className={cn(
                        "w-auto lg:w-5 text-center lg:text-right font-mono text-sm lg:text-[11px] shrink-0",
                        isActive ? "text-[#111]" : "text-white/40 group-hover:text-white/70"
                      )}
                    >
                      {ep.number}
                    </span>
                    <span className="hidden lg:block truncate flex-1">
                      Episode {ep.number}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2 (CENTER): VIDEO PLAYER + UNDER-PLAYER CONTROLS + SERVER CARD */}
        {/* ========================================================================= */}
        <div className="order-1 lg:order-2 lg:col-span-6 xl:col-span-7 flex flex-col gap-3">
          {/* Video Iframe Container */}
          <div
            id="player-wrap"
            ref={wrapRef}
            className="relative w-full aspect-video rounded-xl lg:rounded-lg overflow-hidden bg-black border border-white/10 shadow-2xl z-20"
          >
            {episodes.length === 0 ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#0e1017] overflow-hidden">
                {anime.bannerImage || anime.coverImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-25 blur-md scale-105"
                    style={{ backgroundImage: `url(${anime.bannerImage || anime.coverImage})` }}
                  />
                ) : null}
                <div className="relative z-10 max-w-md w-full flex flex-col items-center gap-3 text-center">
                  <span className="px-2.5 py-0.5 rounded bg-[#ff2f6d]/20 text-[#ff2f6d] font-extrabold text-[11px] uppercase tracking-wider">
                    {anime.status === "NOT_YET_RELEASED" ? "Upcoming Release" : "No Aired Episodes"}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white line-clamp-2">
                    {title}
                  </h3>
                  <UpcomingCountdown nextAiringEpisode={anime.nextAiringEpisode} />
                </div>
              </div>
            ) : hasError || (selectedServer === "anikoto" && !embedUrl) ? (
              <PlayerError
                onRetry={() => {
                  tryNextServer();
                }}
                message={selectedServer === "anikoto"
                  ? "Server 3 is currently unavailable. Try Server 1 or Server 2."
                  : "This episode stream is currently unavailable on this server. Please try another server or audio language below."}
              />
            ) : (
              <iframe
                key={selectedServer + "-" + currentEpisode + "-" + track + "-" + reloadKey}
                ref={iframeRef}
                src={embedUrl}
                width="100%"
                height="100%"
                allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
                referrerPolicy={selectedServer === "anikoto" ? "strict-origin-when-cross-origin" : undefined}
                allowFullScreen
                className="w-full h-full border-0"
                onError={() => setHasError(true)}
              />
            )}
          </div>

          {/* Control Bar Directly Under Video */}
          {episodes.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 lg:px-2 lg:py-1.5 bg-[#13151b] rounded-xl lg:rounded-lg border border-white/5 text-[11px] font-semibold text-white/80">
            {/* Left Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Auto Play Toggle */}
              <button
                onClick={toggleAutoPlay}
                className="flex items-center gap-1 hover:text-[#ff2f6d] transition-colors cursor-pointer"
                title="Automatically start playback"
              >
                <span className="text-white/60">Auto Play</span>
                <span
                  className={cn(
                    "px-1 py-0.2 rounded text-[10px] font-bold transition-colors",
                    autoPlay ? "bg-[#ff2f6d]/20 text-[#ff2f6d]" : "bg-white/10 text-white/40"
                  )}
                >
                  {autoPlay ? "On" : "Off"}
                </span>
              </button>

              {/* Auto Next Toggle */}
              <button
                onClick={toggleAutoNext}
                className="flex items-center gap-1 hover:text-[#ff2f6d] transition-colors cursor-pointer"
                title="Automatically advance to the next episode"
              >
                <span className="text-white/60">Auto Next</span>
                <span
                  className={cn(
                    "px-1 py-0.2 rounded text-[10px] font-bold transition-colors",
                    autoNext ? "bg-[#ff2f6d]/20 text-[#ff2f6d]" : "bg-white/10 text-white/40"
                  )}
                >
                  {autoNext ? "On" : "Off"}
                </span>
              </button>

              {/* Auto Skip Intro Toggle */}
              <button
                onClick={toggleAutoSkipIntro}
                className="flex items-center gap-1 hover:text-[#ff2f6d] transition-colors cursor-pointer"
                title="Automatically skip opening intro theme"
              >
                <span className="text-white/60">Auto Skip Intro</span>
                <span
                  className={cn(
                    "px-1 py-0.2 rounded text-[10px] font-bold transition-colors",
                    autoSkipIntro ? "bg-[#ff2f6d]/20 text-[#ff2f6d]" : "bg-white/10 text-white/40"
                  )}
                >
                  {autoSkipIntro ? "On" : "Off"}
                </span>
              </button>

              {/* SUB / DUB Persistent Switcher */}
              <div className="flex items-center rounded bg-[#1c1f28] p-0.5 border border-white/5 text-[10px] font-bold">
                <button
                  onClick={() => handleSelectTrack("sub")}
                  className={cn(
                    "px-2 py-0.5 rounded transition-all cursor-pointer",
                    track === "sub"
                      ? "bg-[#ff4f86] text-[#111] shadow-sm font-extrabold"
                      : "text-white/60 hover:text-white"
                  )}
                  title="Switch to Japanese Audio with English Subtitles"
                >
                  SUB
                </button>
                {currentDubAvailable && (
                  <button
                    onClick={() => handleSelectTrack("dub")}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all cursor-pointer",
                      track === "dub"
                        ? "bg-[#ff4f86] text-[#111] shadow-sm font-extrabold"
                        : "text-white/60 hover:text-white"
                    )}
                    title="Switch to English Dubbed Audio"
                  >
                    DUB
                  </button>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Add to List */}
              <button
                onClick={handleToggleBookmark}
                className={cn(
                  "p-1.5 rounded bg-[#1c1f28] hover:bg-white/10 transition-colors cursor-pointer",
                  isBookmarked ? "text-[#ff2f6d]" : "text-white/70"
                )}
                title={isBookmarked ? "In Watchlist" : "Add to Watchlist"}
              >
                {isBookmarked ? <Check className="w-3.5 h-3.5 text-[#ff2f6d]" /> : <Plus className="w-3.5 h-3.5" />}
              </button>

              {/* Previous Episode */}
              <button
                disabled={!prevEp}
                onClick={() => prevEp && selectEpisode(prevEp)}
                className="p-1.5 rounded bg-[#1c1f28] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/70 hover:text-white transition-colors cursor-pointer"
                title={prevEp ? `Previous Episode (${prevEp})` : "No previous episode"}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Next Episode */}
              <button
                disabled={!nextEp}
                onClick={() => nextEp && selectEpisode(nextEp)}
                className="p-1.5 rounded bg-[#1c1f28] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/70 hover:text-white transition-colors cursor-pointer"
                title={nextEp ? `Next Episode (${nextEp})` : "No next episode"}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Report Flag */}
              <button
                onClick={() => {
                  setReportSubmitted(false);
                  setIsReportModalOpen(true);
                }}
                className="p-1.5 rounded bg-[#1c1f28] hover:bg-white/10 text-white/70 hover:text-[#ff2f6d] transition-colors cursor-pointer"
                title="Report issue with stream"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          )}

          {/* Upcoming Airing Banner if anime has future episodes */}
          {anime.nextAiringEpisode && episodes.length > 0 && (
            <UpcomingCountdown nextAiringEpisode={anime.nextAiringEpisode} />
          )}

          {/* Two-Tone Server Selection Card */}
          {episodes.length > 0 && (
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-12 rounded-lg overflow-hidden border border-white/5 bg-[#13151b]">
            {/* Left Box (Pink/Rose info card) */}
            <div className="md:col-span-4 p-4 bg-gradient-to-br from-[#ff2f6d]/20 via-[#ff2f6d]/10 to-[#1b1420] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center text-center sm:text-left gap-1">
              <span className="text-xs text-white/80">You are watching</span>
              <span className="text-sm font-black text-[#ff2f6d]">
                Episode {currentEpisode} ({track.toUpperCase()})
              </span>
              <p className="text-[11px] text-white/60 leading-relaxed pt-1">
                If current server doesn&apos;t work please try other servers beside.
              </p>
            </div>

            {/* Right Box (Server pill buttons: SUB, DUB, DL) */}
            <div className="md:col-span-8 p-3.5 flex flex-col gap-2.5 justify-center">
              {/* SUB Row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 w-16 text-xs font-bold text-white/80 shrink-0">
                  <Subtitles className="w-3.5 h-3.5 text-[#ff2f6d]" />
                  <span>SUB:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Server 1: HD-1 (MegaPlay) */}
                  <button
                    onClick={() => handleSelectServer("megaplay", "sub")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
                      selectedServer === "megaplay" && track === "sub"
                        ? "bg-gradient-to-r from-[#ff2f6d] to-[#ff72a1] text-white shadow-sm font-extrabold"
                        : "bg-gradient-to-r from-[#ff2f6d]/20 to-[#ff9f43]/20 border border-[#ff6b81]/45 hover:from-[#ff2f6d]/35 hover:to-[#ff9f43]/35 text-[#ff9eb9]"
                    )}
                  >
                    HD-1
                  </button>

                  {/* Server 2: ZokoAnime */}
                  <button
                    onClick={() => handleSelectServer("zokoanime", "sub")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
                      selectedServer === "zokoanime" && track === "sub"
                        ? "bg-gradient-to-r from-[#5b5ff7] to-[#8b5cf6] text-white shadow-sm font-extrabold"
                        : "bg-gradient-to-r from-[#3b82f6]/20 to-[#8b5cf6]/20 border border-[#7778ff]/45 hover:from-[#3b82f6]/35 hover:to-[#8b5cf6]/35 text-[#b5b4ff]"
                    )}
                  >
                    ZokoAnime
                  </button>

                  <button
                    onClick={() => handleSelectServer("anikoto", "sub")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
                      selectedServer === "anikoto" && track === "sub"
                        ? "bg-gradient-to-r from-[#ff2f6d] to-[#7c3cff] text-white shadow-sm"
                        : "bg-gradient-to-r from-[#a855f7]/20 to-[#ec4899]/20 border border-[#c05cff]/45 hover:from-[#a855f7]/35 hover:to-[#ec4899]/35 text-[#e0b1ff]"
                    )}
                    title={anikotoSource?.subUrl
                      ? "Server 3 SUB source is available for this episode"
                      : "Server 3 has no SUB source for this episode yet"}
                  >
                    Server 3
                  </button>
                  {isAnikotoLoading && (
                    <span className="px-2 text-[10px] text-white/40">Checking Server 3…</span>
                  )}
                </div>
              </div>

              {/* DUB Row — only when this exact episode has a confirmed dub source */}
              {currentDubAvailable && <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 w-16 text-xs font-bold text-white/80 shrink-0">
                  <Mic className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>DUB:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Server 1: HD-1 (MegaPlay) */}
                  <button
                    onClick={() => handleSelectServer("megaplay", "dub")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
                      selectedServer === "megaplay" && track === "dub"
                        ? "bg-gradient-to-r from-[#16a46d] to-[#34d399] text-[#06140e] shadow-sm font-extrabold"
                        : "bg-gradient-to-r from-[#16a34a]/20 to-[#84cc16]/20 border border-[#4ade80]/45 hover:from-[#16a34a]/35 hover:to-[#84cc16]/35 text-[#8de7ae]"
                    )}
                  >
                    HD-1
                  </button>

                  {/* Server 2: ZokoAnime */}
                  <button
                    onClick={() => handleSelectServer("zokoanime", "dub")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
                      selectedServer === "zokoanime" && track === "dub"
                        ? "bg-gradient-to-r from-[#0891b2] to-[#22d3ee] text-[#041418] shadow-sm font-extrabold"
                        : "bg-gradient-to-r from-[#06b6d4]/20 to-[#3b82f6]/20 border border-[#38bdf8]/45 hover:from-[#06b6d4]/35 hover:to-[#3b82f6]/35 text-[#83e6f5]"
                    )}
                  >
                    ZokoAnime
                  </button>
                  {anikotoSource?.dubUrl && (
                    <button
                      onClick={() => handleSelectServer("anikoto", "dub")}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer",
                        selectedServer === "anikoto" && track === "dub"
                          ? "bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-[#1a0b02] shadow-sm"
                          : "bg-gradient-to-r from-[#f59e0b]/20 to-[#ef4444]/20 border border-[#f59e0b]/45 hover:from-[#f59e0b]/35 hover:to-[#ef4444]/35 text-[#ffd078]"
                      )}
                    >
                      Server 3
                    </button>
                  )}
                </div>
              </div>}
            </div>
          </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3 (RIGHT): ANIME MINI SIDEBAR (~3 cols on desktop) */}
        {/* ========================================================================= */}
        {partyCode ? (
          <WatchTogetherPanel
            room={watchTogether.room}
            identity={watchTogether.identity}
            status={watchTogether.status}
            error={watchTogether.error}
            isHost={watchTogether.isHost}
            onSend={watchTogether.sendChat}
            onTransfer={watchTogether.transferHost}
            onLeave={watchTogether.leave}
          />
        ) : <div className="order-3 lg:order-3 lg:col-span-3 xl:col-span-3 bg-[#13151b] rounded-xl lg:rounded-lg border border-white/5 p-4 flex flex-col gap-4 text-xs">
          {/* Top: Poster Thumbnail + Title */}
          <div className="flex gap-3">
            <div className="relative w-20 h-28 shrink-0 rounded overflow-hidden shadow-md">
              <Image
                src={anime.coverImage}
                alt={title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <h2 className="text-sm font-black text-white line-clamp-2 leading-snug">
                {title}
              </h2>

              {/* Badges: R, HD, SUB, DUB, TV, duration */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/90">
                  R
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#ff2f6d]/20 text-[#ff2f6d] text-[10px] font-extrabold">
                  HD
                </span>
                {episodes.length > 0 ? (
                  <>
                    <span className="px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#4ade80] text-[10px] font-bold flex items-center gap-0.5" title="Confirmed subtitle episodes">
                      <Subtitles className="w-2.5 h-2.5" />
                      <span>{confirmedSubCount || episodes.length}</span>
                    </span>
                    {confirmedDubCount > 0 && <span className="px-1.5 py-0.5 rounded bg-[#06b6d4]/20 text-[#22d3ee] text-[10px] font-bold flex items-center gap-0.5" title="Confirmed dubbed episodes">
                      <Mic className="w-2.5 h-2.5" />
                      <span>{confirmedDubCount}</span>
                    </span>}
                  </>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-[#ff2f6d]/20 text-[#ff2f6d] text-[10px] font-extrabold uppercase">
                    Upcoming
                  </span>
                )}
                <span className="text-[10px] text-white/50 font-semibold">
                  {anime.format || "TV"} • {anime.duration || 24}m
                </span>
              </div>
            </div>
          </div>

          {/* Synopsis Excerpt */}
          <div className="flex flex-col gap-1">
            <p className={cn(
              "text-white/60 text-[11px] leading-relaxed",
              !isSynopsisExpanded && "line-clamp-3"
            )}>
              {synopsis}
            </p>
            {synopsis.length > 150 && (
              <button
                type="button"
                onClick={() => setIsSynopsisExpanded((expanded) => !expanded)}
                className="self-start text-[11px] font-bold text-[#ff2f6d] hover:underline cursor-pointer"
                aria-expanded={isSynopsisExpanded}
              >
                {isSynopsisExpanded ? "Show less" : "More information"}
              </button>
            )}
          </div>

          {/* Promotional SEO Blurb */}
          <p className="text-[11px] text-white/50 leading-relaxed">
            An:me is the best site to watch{" "}
            <strong className="text-white/80">{title}</strong> SUB online
            {confirmedDubCount > 0 && <> or watch <strong className="text-white/80">{title} DUB</strong> where available</>} in HD quality.
            You can also find related anime on An:me.
          </p>

          {/* View Detail Toggle */}
          <Link
            href={`/anime/${anime.id}/details`}
            className="text-[#ff2f6d] hover:underline font-bold text-xs self-start cursor-pointer"
          >
            View details
          </Link>

          {/* Rating & Emotion Reaction Widget */}
          <div className="mt-1 pt-3 border-t border-white/5 flex flex-col gap-2.5 bg-[#0e1015]/60 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{animeScore}</span>
              </div>
              <button
                onClick={() => alert("Thanks for voting!")}
                className="text-white/70 hover:text-[#ff2f6d] text-[11px] font-bold transition-colors cursor-pointer"
              >
                Vote now
              </button>
            </div>

            <span className="text-[11px] text-white/60">
              What do you think about this anime?
            </span>

            {/* Reaction Buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => handleVoteReaction("boring")}
                className={cn(
                  "flex flex-col items-center py-2 px-1 rounded transition-colors cursor-pointer",
                  selectedReaction === "boring"
                    ? "bg-[#ff2f6d]/20 text-[#ff2f6d]"
                    : "bg-[#181a24] hover:bg-[#202330] text-white/70"
                )}
              >
                <span className="text-base">🥱</span>
                <span className="text-[10px] font-bold mt-1">Boring</span>
              </button>

              <button
                onClick={() => handleVoteReaction("great")}
                className={cn(
                  "flex flex-col items-center py-2 px-1 rounded transition-colors cursor-pointer",
                  selectedReaction === "great"
                    ? "bg-[#ff2f6d]/20 text-[#ff2f6d]"
                    : "bg-[#181a24] hover:bg-[#202330] text-white/70"
                )}
              >
                <span className="text-base">😃</span>
                <span className="text-[10px] font-bold mt-1">Great</span>
              </button>

              <button
                onClick={() => handleVoteReaction("amazing")}
                className={cn(
                  "flex flex-col items-center py-2 px-1 rounded transition-colors cursor-pointer",
                  selectedReaction === "amazing"
                    ? "bg-[#ff2f6d]/20 text-[#ff2f6d]"
                    : "bg-[#181a24] hover:bg-[#202330] text-white/70"
                )}
              >
                <span className="text-base">🤩</span>
                <span className="text-[10px] font-bold mt-1">Amazing</span>
              </button>
            </div>

            {/* Bottom comment counter & avatar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-white/60 text-[11px]">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#ff2f6d]" />
                <span className="font-bold">0</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-[10px] font-black text-black">
                👒
              </div>
            </div>
          </div>
        </div>}
      </div>

      {/* Interactive Report Stream Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#141620] border border-white/10 rounded-xl shadow-2xl p-5 flex flex-col gap-4 text-xs select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#ff2f6d]" />
                Report Episode Issue
              </span>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  setReportSubmitted(false);
                }}
                className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  ✓
                </div>
                <span className="font-bold text-sm text-white">Thank you for reporting!</span>
                <span className="text-white/60 text-[11px] max-w-xs">
                  Our stream monitoring team has logged this issue for Episode {currentEpisode} and is verifying backup servers.
                </span>
                <button
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setReportSubmitted(false);
                  }}
                  className="mt-3 px-5 py-2 rounded-lg bg-[#ff2f6d] hover:bg-[#e9235e] text-white font-bold cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="text-white/70">
                  Please select the issue you encountered on{" "}
                  <span className="text-white font-bold">Episode {currentEpisode}</span>:
                </div>

                <div className="space-y-2">
                  {[
                    "Video buffering or not playing",
                    "Audio out of sync or missing",
                    "Wrong episode or wrong title",
                    "Subtitles missing or out of sync",
                    "Playback error on current server",
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors",
                        reportReason === reason
                          ? "bg-[#ff2f6d]/15 border-[#ff2f6d]/40 text-white font-semibold"
                          : "bg-white/5 border-transparent text-white/70 hover:bg-white/10"
                      )}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        className="accent-[#ff2f6d]"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportSubmitted(true)}
                    className="px-4 py-1.5 rounded-lg bg-[#ff2f6d] hover:bg-[#e9235e] text-white font-bold cursor-pointer transition-all shadow-md shadow-[#ff2f6d]/20"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#141620] border border-[#ff2f6d]/40 text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-[#ff2f6d] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
