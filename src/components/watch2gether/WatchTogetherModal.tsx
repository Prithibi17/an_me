"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Users, Plus, LogIn, Loader2 } from "lucide-react";
import { openWatchSocket, waitForRoom } from "@/lib/watch-together/client";

export function WatchTogetherModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const match = pathname.match(/^\/anime\/(\d+)/);
  const animeId = match ? Number(match[1]) : null;

  if (!isOpen) return null;

  const run = async (type: "create" | "join") => {
    setBusy(true); setError("");
    try {
      const { socket, token } = await openWatchSocket();
      const episode = Math.max(1, Number(new URLSearchParams(window.location.search).get("ep") || 1));
      const pending = waitForRoom(socket);
      socket.send(JSON.stringify(type === "create"
        ? { type, token, animeId, episode }
        : { type, token, roomCode: joinCode.trim().toUpperCase() }));
      const room = await pending;
      socket.close();
      onClose();
      router.push(`/anime/${room.animeId}?ep=${room.episode}&party=${room.roomCode}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open room.");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#13151b] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5" aria-label="Close"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-9 h-9 rounded-full bg-[#ff2f6d]/15 text-[#ff2f6d] grid place-items-center"><Users className="w-4 h-4" /></span>
          <h2 className="text-lg font-black text-white">Watch Together</h2>
        </div>
        <p className="text-xs text-white/50 ml-12 mb-6">Watch anime with your friends in real time.</p>

        <button disabled={busy || !animeId} onClick={() => run("create")} className="w-full h-11 rounded-xl bg-[#ff2f6d] hover:bg-[#e9235e] disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Room
        </button>
        {!animeId && <p className="mt-2 text-[11px] text-amber-300/80 text-center">Open an anime episode before creating a room.</p>}

        <div className="flex items-center gap-3 my-5"><span className="h-px flex-1 bg-white/5" /><span className="text-[10px] font-bold uppercase text-white/30">or</span><span className="h-px flex-1 bg-white/5" /></div>

        <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="Enter Room Code" className="w-full h-11 px-4 rounded-xl bg-[#0e1015] border border-white/10 text-sm font-mono tracking-[0.2em] text-white placeholder:tracking-normal placeholder:text-white/30 focus:outline-none focus:border-[#ff2f6d]/50" />
        <button disabled={busy || joinCode.length !== 6} onClick={() => run("join")} className="mt-2 w-full h-11 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> Join Room</button>
        {error && <p className="mt-3 text-xs text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
}
