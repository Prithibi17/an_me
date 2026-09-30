"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Crown, LogOut, Send, Users, Wifi, WifiOff, X } from "lucide-react";
import type { WatchIdentity, WatchRoom } from "@/lib/watch-together/client";

interface Props {
  room: WatchRoom | null; identity: WatchIdentity | null; status: string; error: string; isHost: boolean;
  onSend: (text: string) => void; onTransfer: (id: string) => void; onLeave: (end?: boolean) => void;
}

export function WatchTogetherPanel(props: Props) {
  const { room, identity, status, error, isHost, onSend, onTransfer, onLeave } = props;
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState<"invite" | "code" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [room?.messages.length]);

  const copy = async (kind: "invite" | "code") => {
    if (!room) return;
    const text = kind === "code" ? room.roomCode : `${window.location.origin}/anime/${room.animeId}?ep=${room.episode}&party=${room.roomCode}`;
    await navigator.clipboard.writeText(text); setCopied(kind); window.setTimeout(() => setCopied(null), 1600);
  };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!message.trim()) return; onSend(message.trim()); setMessage(""); };

  const content = (
    <>
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2"><Users className="w-4 h-4 text-[#ff2f6d]" /><span className="font-black text-sm text-white">Watch Together</span></div>
        <div className="flex items-center gap-2 text-[10px] text-white/50">
          {status === "connected" ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />}
          <span>{room?.participants.filter((p) => p.connected).length || 0}/10</span>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1"><X className="w-4 h-4" /></button>
        </div>
      </div>
      {error && <div className="px-3 py-2 bg-red-500/10 text-red-300 text-[10px]">{error}</div>}
      <div className="p-3 border-b border-white/5 space-y-2">
        {(room?.participants || []).map((person) => (
          <div key={person.id} className="flex items-center gap-2 text-xs">
            <span className="relative w-7 h-7 rounded-full bg-white/5 grid place-items-center">{person.avatar || person.name[0]}<i className={`absolute right-0 bottom-0 w-2 h-2 rounded-full border border-[#13151b] ${person.connected ? "bg-emerald-400" : "bg-white/20"}`} /></span>
            <span className="truncate text-white/80">{person.id === identity?.id ? "You" : person.name}</span>
            {person.id === room?.hostId && <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-amber-300"><Crown className="w-3 h-3" /> Host</span>}
            {isHost && person.id !== identity?.id && person.connected && <button onClick={() => onTransfer(person.id)} className="ml-auto text-[9px] text-[#ff2f6d] hover:underline">Make host</button>}
          </div>
        ))}
      </div>
      <div className="p-3 border-b border-white/5 space-y-2">
        <div className="flex items-center justify-between text-[11px]"><span className="text-white/45">Room</span><b className="font-mono tracking-widest text-white">{room?.roomCode || "------"}</b></div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => copy("invite")} className="h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 flex items-center justify-center gap-1">{copied === "invite" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy Invite</button>
          <button onClick={() => copy("code")} className="h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 flex items-center justify-center gap-1">{copied === "code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy Code</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
        <span className="text-[11px] font-bold text-white/65">Chat</span>
        <div ref={chatRef} className="flex-1 min-h-[130px] overflow-y-auto space-y-2 pr-1">
          {(room?.messages || []).map((item) => item.system ? <p key={item.id} className="text-[10px] text-white/35 text-center">{item.text}</p> : (
            <div key={item.id} className="text-[11px]"><div className="flex items-center gap-1.5"><b className="text-[#ff2f6d]">{item.senderId === identity?.id ? "You" : item.sender}</b><time className="text-[9px] text-white/30">{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p className="text-white/75 break-words">{item.text}</p></div>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-1.5"><input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} placeholder="Type a message..." className="min-w-0 flex-1 h-9 px-2.5 rounded bg-[#0e1015] border border-white/5 text-xs text-white focus:outline-none focus:border-[#ff2f6d]/40" /><button className="w-9 h-9 rounded bg-[#ff2f6d] grid place-items-center"><Send className="w-3.5 h-3.5" /></button></form>
      </div>
      <div className="p-3 border-t border-white/5 flex gap-2"><button onClick={() => onLeave(false)} className="flex-1 h-8 rounded bg-white/5 text-white/60 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1"><LogOut className="w-3 h-3" /> Leave</button>{isHost && <button onClick={() => onLeave(true)} className="flex-1 h-8 rounded bg-red-500/10 text-red-400 text-[10px] font-bold">End Room</button>}</div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:col-span-3 xl:col-span-3 h-[580px] rounded-lg border border-white/5 bg-[#13151b] flex-col overflow-hidden">{content}</aside>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed right-4 bottom-20 z-40 h-11 px-4 rounded-full bg-[#ff2f6d] text-white shadow-xl flex items-center gap-2 text-xs font-bold"><Users className="w-4 h-4" /> Room {room?.participants.filter((p) => p.connected).length || 0}<ChevronDown className="w-3 h-3" /></button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setMobileOpen(false)}><div onClick={(e) => e.stopPropagation()} className="w-full h-[72vh] rounded-t-2xl border-t border-white/10 bg-[#13151b] flex flex-col overflow-hidden">{content}</div></div>}
    </>
  );
}
