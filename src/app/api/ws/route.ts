import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  experimental_upgradeWebSocket,
  type WebSocket as VercelWebSocket,
  type WebSocketData,
} from "@vercel/functions";

export const runtime = "nodejs";
export const maxDuration = 300;

type Participant = {
  id: string;
  name: string;
  avatar: string;
  connected: boolean;
  socket: RoomSocket | null;
  disconnectTimer?: ReturnType<typeof setTimeout>;
};

type ChatMessage = {
  id: string;
  senderId: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  system?: boolean;
};

type Room = {
  id: string;
  code: string;
  hostId: string;
  animeId: number;
  episode: number;
  currentTime: number;
  playing: boolean;
  updatedAt: number;
  participants: Map<string, Participant>;
  messages: ChatMessage[];
  createdAt: number;
};

type RoomSocket = VercelWebSocket & {
  room?: Room;
  participantId?: string;
  rates?: Record<string, number[]>;
};

type Identity = { id: string; name: string; avatar?: string; exp: number };
type ClientMessage = Record<string, unknown> & { type?: string };

const globalRooms = globalThis as typeof globalThis & { __anmeWatchRooms?: Map<string, Room> };
const rooms = globalRooms.__anmeWatchRooms ??= new Map<string, Room>();
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function identityFromToken(token: unknown): Identity | null {
  if (typeof token !== "string") return null;
  const secret = process.env.WATCH_TOGETHER_SECRET || "anme-watch-together-local-secret";
  if (!process.env.WATCH_TOGETHER_SECRET && process.env.NODE_ENV === "production") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;
  try {
    const identity = JSON.parse(Buffer.from(payload, "base64url").toString()) as Identity;
    return identity.exp > Date.now() && identity.id && identity.name ? identity : null;
  } catch {
    return null;
  }
}

function createRoomCode() {
  let code: string;
  do code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  while (rooms.has(code));
  return code;
}

function cleanText(value: unknown) {
  return String(value || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 300);
}

function publicRoom(room: Room) {
  const elapsed = room.playing ? (Date.now() - room.updatedAt) / 1000 : 0;
  return {
    roomId: room.id,
    roomCode: room.code,
    hostId: room.hostId,
    animeId: room.animeId,
    episode: room.episode,
    currentTime: Math.max(0, room.currentTime + elapsed),
    playing: room.playing,
    participants: [...room.participants.values()].map(({ id, name, avatar, connected }) => ({ id, name, avatar, connected })),
    messages: room.messages.slice(-100),
    createdAt: room.createdAt,
  };
}

function send(socket: RoomSocket | null | undefined, payload: unknown) {
  if (socket?.readyState === 1) socket.send(JSON.stringify(payload));
}

function broadcast(room: Room, payload: unknown, exceptId?: string) {
  for (const member of room.participants.values()) if (member.id !== exceptId) send(member.socket, payload);
}

function broadcastState(room: Room) {
  broadcast(room, { type: "room-state", room: publicRoom(room) });
}

function systemMessage(room: Room, text: string) {
  const message: ChatMessage = {
    id: randomUUID(), senderId: "system", sender: "System", avatar: "", text, timestamp: Date.now(), system: true,
  };
  room.messages.push(message);
  broadcast(room, { type: "chat", message });
}

function rateOkay(socket: RoomSocket, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  socket.rates ||= {};
  const values = (socket.rates[key] || []).filter((time) => now - time < windowMs);
  if (values.length >= limit) return false;
  values.push(now);
  socket.rates[key] = values;
  return true;
}

function removeDisconnectedMember(room: Room, member: Participant) {
  if (member.connected) return;
  room.participants.delete(member.id);
  systemMessage(room, `${member.name} left the room.`);
  if (room.participants.size === 0) {
    rooms.delete(room.code);
    return;
  }
  if (room.hostId === member.id) {
    const nextHost = [...room.participants.values()].find((item) => item.connected);
    if (nextHost) {
      room.hostId = nextHost.id;
      systemMessage(room, `${nextHost.name} is now the host.`);
    } else {
      broadcast(room, { type: "ended", message: "The room ended because the host left." });
      rooms.delete(room.code);
      return;
    }
  }
  broadcastState(room);
}

function handleMessage(socket: RoomSocket, raw: WebSocketData) {
  let data: ClientMessage;
  try {
    data = JSON.parse(raw.toString()) as ClientMessage;
  } catch {
    send(socket, { type: "error", message: "Invalid request." });
    return;
  }
  if (!rateOkay(socket, "actions", 30, 10_000)) {
    send(socket, { type: "error", message: "Too many actions." });
    return;
  }

  if (data.type === "create" || data.type === "join") {
    const identity = identityFromToken(data.token);
    if (!identity) return send(socket, { type: "error", message: "Invalid or expired identity." });
    const code = data.type === "create" ? createRoomCode() : String(data.roomCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    let room = rooms.get(code);
    if (data.type === "create") {
      const animeId = Number(data.animeId);
      const episode = Number(data.episode);
      if (!Number.isInteger(animeId) || animeId < 1 || !Number.isInteger(episode) || episode < 1) {
        return send(socket, { type: "error", message: "Open an anime episode before creating a room." });
      }
      room = {
        id: randomUUID(), code, hostId: identity.id, animeId, episode, currentTime: 0, playing: false,
        updatedAt: Date.now(), participants: new Map(), messages: [], createdAt: Date.now(),
      };
      rooms.set(code, room);
    }
    if (!room) return send(socket, { type: "error", message: "Room not found or it has expired." });
    if (room.participants.size >= 10 && !room.participants.has(identity.id)) return send(socket, { type: "error", message: "Room is full." });
    if (socket.room && socket.room !== room) return send(socket, { type: "error", message: "Leave the current room first." });
    const existing = room.participants.get(identity.id);
    if (existing?.disconnectTimer) clearTimeout(existing.disconnectTimer);
    const member: Participant = {
      id: identity.id,
      name: cleanText(identity.name).slice(0, 32),
      avatar: cleanText(identity.avatar).slice(0, 8),
      connected: true,
      socket,
    };
    room.participants.set(identity.id, member);
    socket.room = room;
    socket.participantId = identity.id;
    send(socket, { type: data.type === "create" ? "created" : "joined", room: publicRoom(room) });
    if (!existing) systemMessage(room, `${member.name} joined the room.`);
    broadcastState(room);
    return;
  }

  const room = socket.room;
  const participantId = socket.participantId;
  if (!room || !participantId || !room.participants.has(participantId)) {
    send(socket, { type: "error", message: "Join a room first." });
    return;
  }
  const isHost = room.hostId === participantId;

  if (data.type === "control") {
    if (!isHost) return send(socket, { type: "error", message: "Only the host controls playback." });
    if (!["play", "pause", "seek", "episode", "sync"].includes(String(data.action))) return;
    if (data.action === "episode") {
      const episode = Number(data.episode);
      if (!Number.isInteger(episode) || episode < 1) return;
      room.episode = episode;
      room.currentTime = 0;
      room.playing = false;
    } else {
      const time = Number(data.currentTime);
      if (Number.isFinite(time) && time >= 0) room.currentTime = Math.min(time, 86_400);
      if (data.action === "play") room.playing = true;
      if (data.action === "pause") room.playing = false;
      if (typeof data.playing === "boolean") room.playing = data.playing;
    }
    room.updatedAt = Date.now();
    broadcast(room, {
      type: "control", action: data.action, episode: room.episode, currentTime: room.currentTime,
      playing: room.playing, serverTime: room.updatedAt,
    }, participantId);
    return;
  }
  if (data.type === "chat") {
    if (!rateOkay(socket, "chat", 5, 10_000)) return send(socket, { type: "error", message: "Please slow down." });
    const text = cleanText(data.text);
    if (!text) return;
    const member = room.participants.get(participantId)!;
    const message: ChatMessage = {
      id: randomUUID(), senderId: member.id, sender: member.name, avatar: member.avatar, text, timestamp: Date.now(),
    };
    room.messages.push(message);
    broadcast(room, { type: "chat", message });
    return;
  }
  if (data.type === "transfer-host") {
    if (!isHost) return send(socket, { type: "error", message: "Only the host can transfer control." });
    const target = room.participants.get(String(data.participantId));
    if (!target?.connected) return send(socket, { type: "error", message: "Participant is unavailable." });
    room.hostId = target.id;
    systemMessage(room, `${target.name} is now the host.`);
    broadcastState(room);
    return;
  }
  if (data.type === "end-room") {
    if (!isHost) return send(socket, { type: "error", message: "Only the host can end the room." });
    broadcast(room, { type: "ended", message: "The host ended the room." });
    rooms.delete(room.code);
    for (const member of room.participants.values()) member.socket?.close();
    return;
  }
  if (data.type === "leave") socket.close();
}

export async function GET() {
  return experimental_upgradeWebSocket((rawSocket) => {
    const socket = rawSocket as RoomSocket;
    socket.on("message", (data) => handleMessage(socket, data));
    socket.on("close", () => {
      const room = socket.room;
      const member = room?.participants.get(socket.participantId || "");
      if (!room || !member || member.socket !== socket) return;
      member.connected = false;
      member.socket = null;
      broadcastState(room);
      member.disconnectTimer = setTimeout(() => removeDisconnectedMember(room, member), 15_000);
    });
  }, { maxPayload: 8 * 1024 });
}
