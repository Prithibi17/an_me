import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  experimental_upgradeWebSocket,
  type WebSocket as VercelWebSocket,
  type WebSocketData,
} from "@vercel/functions";
import { Redis } from "@upstash/redis";

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

type StoredRoom = Omit<Room, "participants"> & {
  participants: Array<Omit<Participant, "socket" | "disconnectTimer">>;
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
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const roomKey = (code: string) => `anme:watch-room:${code}`;

function serializeRoom(room: Room): StoredRoom {
  return {
    ...room,
    participants: [...room.participants.values()].map(({ id, name, avatar, connected }) => ({ id, name, avatar, connected })),
  };
}

function hydrateRoom(stored: StoredRoom, existing?: Room): Room {
  const localParticipants = existing?.participants || new Map<string, Participant>();
  const participants = new Map<string, Participant>();
  for (const person of stored.participants) {
    const local = localParticipants.get(person.id);
    participants.set(person.id, { ...person, socket: local?.socket || null, disconnectTimer: local?.disconnectTimer });
  }
  const room = { ...stored, participants };
  rooms.set(room.code, room);
  for (const member of participants.values()) if (member.socket) member.socket.room = room;
  return room;
}

async function loadRoom(code: string) {
  if (!redis) return rooms.get(code);
  const stored = await redis.get<StoredRoom>(roomKey(code));
  return stored ? hydrateRoom(stored, rooms.get(code)) : undefined;
}

async function saveRoom(room: Room) {
  rooms.set(room.code, room);
  if (redis) await redis.set(roomKey(room.code), serializeRoom(room), { ex: 6 * 60 * 60 });
}

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

async function destroyRoom(room: Room, message?: string) {
  if (message) broadcast(room, { type: "ended", message });
  rooms.delete(room.code);
  if (redis) await redis.del(roomKey(room.code));
  for (const member of room.participants.values()) {
    if (member.disconnectTimer) clearTimeout(member.disconnectTimer);
    if (member.socket) {
      member.socket.room = undefined;
      member.socket.participantId = undefined;
      member.socket.close();
      member.socket = null;
    }
  }
  room.messages.length = 0;
  room.participants.clear();
  room.currentTime = 0;
  room.playing = false;
}

async function pruneExpiredRooms() {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const room of rooms.values()) {
    if (room.createdAt < cutoff) await destroyRoom(room, "Room expired.");
  }
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

async function removeDisconnectedMember(room: Room, member: Participant) {
  const latest = await loadRoom(room.code);
  if (!latest) return;
  const currentMember = latest.participants.get(member.id);
  if (!currentMember || currentMember.connected) return;
  latest.participants.delete(currentMember.id);
  systemMessage(latest, `${currentMember.name} left the room.`);
  if (latest.participants.size === 0) {
    await destroyRoom(latest);
    return;
  }
  if (latest.hostId === currentMember.id) {
    const nextHost = [...latest.participants.values()].find((item) => item.connected);
    if (nextHost) {
      latest.hostId = nextHost.id;
      systemMessage(latest, `${nextHost.name} is now the host.`);
    } else {
      await destroyRoom(latest, "The room ended because the host left.");
      return;
    }
  }
  broadcastState(latest);
  await saveRoom(latest);
}

async function handleMessage(socket: RoomSocket, raw: WebSocketData) {
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
    let room = await loadRoom(code);
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
      await saveRoom(room);
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
    await saveRoom(room);
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
    await saveRoom(room);
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
    await saveRoom(room);
    return;
  }
  if (data.type === "transfer-host") {
    if (!isHost) return send(socket, { type: "error", message: "Only the host can transfer control." });
    const target = room.participants.get(String(data.participantId));
    if (!target?.connected) return send(socket, { type: "error", message: "Participant is unavailable." });
    room.hostId = target.id;
    systemMessage(room, `${target.name} is now the host.`);
    broadcastState(room);
    await saveRoom(room);
    return;
  }
  if (data.type === "end-room") {
    if (!isHost) return send(socket, { type: "error", message: "Only the host can end the room." });
    await destroyRoom(room, "The host ended the room.");
    return;
  }
  if (data.type === "leave") socket.close();
}

export async function GET() {
  await pruneExpiredRooms();
  return experimental_upgradeWebSocket((rawSocket) => {
    const socket = rawSocket as RoomSocket;
    socket.on("message", (data) => { void handleMessage(socket, data); });
    socket.on("close", async () => {
      clearInterval(syncTimer);
      const localRoom = socket.room;
      if (!localRoom) return;
      const room = await loadRoom(localRoom.code) || localRoom;
      const member = room.participants.get(socket.participantId || "");
      if (!member) return;
      member.connected = false;
      member.socket = null;
      broadcastState(room);
      await saveRoom(room);
      member.disconnectTimer = setTimeout(() => { void removeDisconnectedMember(room, member); }, 15_000);
    });
    const syncTimer = setInterval(async () => {
      if (!socket.room || !socket.participantId || socket.readyState !== 1) return;
      const latest = await loadRoom(socket.room.code);
      if (!latest) {
        send(socket, { type: "ended", message: "The room ended or expired." });
        socket.close();
        return;
      }
      const member = latest.participants.get(socket.participantId);
      if (member) {
        member.connected = true;
        member.socket = socket;
        socket.room = latest;
        await saveRoom(latest);
      }
      send(socket, { type: "room-state", room: publicRoom(latest) });
    }, 1000);
  }, { maxPayload: 8 * 1024 });
}
