"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getWatchIdentity, watchSocketUrl, type WatchIdentity, type WatchMessage, type WatchRoom } from "@/lib/watch-together/client";

export type RoomControl = { action: "play" | "pause" | "seek" | "episode" | "sync"; episode: number; currentTime: number; playing: boolean; serverTime?: number };

export function useWatchTogether(roomCode: string | null, onRemoteControl: (control: RoomControl) => void) {
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [identity, setIdentity] = useState<WatchIdentity | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "reconnecting">("disconnected");
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onRemoteControl);
  const intentionalClose = useRef(false);

  useEffect(() => {
    callbackRef.current = onRemoteControl;
  }, [onRemoteControl]);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    let retryTimer: number | undefined;
    let attempts = 0;
    intentionalClose.current = false;

    const connect = async () => {
      setStatus(attempts ? "reconnecting" : "connecting");
      try {
        const auth = await getWatchIdentity();
        if (cancelled) return;
        setIdentity(auth.identity);
        const socket = new WebSocket(watchSocketUrl());
        socketRef.current = socket;
        socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "join", token: auth.token, roomCode })));
        socket.addEventListener("message", (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "joined" || data.type === "room-state") {
            setRoom((previous) => {
              if (data.type === "joined" || !previous || previous.episode !== data.room.episode || previous.playing !== data.room.playing || Math.abs(previous.currentTime - data.room.currentTime) > 2.5) {
                callbackRef.current({ action: "sync", episode: data.room.episode, currentTime: data.room.currentTime, playing: data.room.playing });
              }
              return data.room;
            });
            setStatus("connected"); setError(""); attempts = 0;
          } else if (data.type === "control") {
            setRoom((previous) => previous ? { ...previous, episode: data.episode, currentTime: data.currentTime, playing: data.playing } : previous);
            callbackRef.current(data);
          } else if (data.type === "chat") {
            setRoom((previous) => previous ? { ...previous, messages: [...previous.messages, data.message as WatchMessage].slice(-100) } : previous);
          } else if (data.type === "ended") {
            setError(data.message || "Room ended."); intentionalClose.current = true; socket.close(); setRoom(null); setStatus("disconnected");
          } else if (data.type === "error") setError(data.message);
        });
        socket.addEventListener("close", () => {
          if (cancelled || intentionalClose.current) return;
          setStatus("reconnecting");
          attempts += 1;
          retryTimer = window.setTimeout(connect, Math.min(1000 * 2 ** attempts, 10_000));
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Connection failed.");
        if (!cancelled) { attempts += 1; retryTimer = window.setTimeout(connect, Math.min(1000 * 2 ** attempts, 10_000)); }
      }
    };
    connect();
    return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer); socketRef.current?.close(); };
  }, [roomCode]);

  const send = useCallback((payload: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(payload));
  }, []);
  const sendControl = useCallback((control: Partial<RoomControl> & { action: RoomControl["action"] }) => send({ type: "control", ...control }), [send]);
  const sendChat = useCallback((text: string) => send({ type: "chat", text }), [send]);
  const transferHost = useCallback((participantId: string) => send({ type: "transfer-host", participantId }), [send]);
  const leave = useCallback((end = false) => { intentionalClose.current = true; send({ type: end ? "end-room" : "leave" }); socketRef.current?.close(); setRoom(null); setStatus("disconnected"); }, [send]);

  return { room, identity, status, error, isHost: Boolean(room && identity && room.hostId === identity.id), sendControl, sendChat, transferHost, leave };
}
