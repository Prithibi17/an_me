import { createServer } from "node:http";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const port = Number(process.env.PORT || 3002);
const secret = process.env.WATCH_TOGETHER_SECRET || "anme-watch-together-local-secret";
if (!process.env.WATCH_TOGETHER_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("WATCH_TOGETHER_SECRET is required in production.");
}
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || "http://localhost:3001").split(",").map((value) => value.trim()).filter(Boolean));
const rooms = new Map();
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function identityFromToken(token) {
  if (typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;
  try {
    const identity = JSON.parse(Buffer.from(payload, "base64url").toString());
    return identity.exp > Date.now() && identity.id && identity.name ? identity : null;
  } catch { return null; }
}
function createRoomCode() {
  let code;
  do { code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(""); }
  while (rooms.has(code));
  return code;
}
function cleanText(value) { return String(value || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 300); }
function publicRoom(room) {
  const elapsed = room.playing ? (Date.now() - room.updatedAt) / 1000 : 0;
  return {
    roomId: room.id, roomCode: room.code, hostId: room.hostId, animeId: room.animeId,
    episode: room.episode, currentTime: Math.max(0, room.currentTime + elapsed), playing: room.playing,
    participants: [...room.participants.values()].map(({ id, name, avatar, connected }) => ({ id, name, avatar, connected })),
    messages: room.messages.slice(-100), createdAt: room.createdAt,
  };
}
function send(socket, payload) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload)); }
function broadcast(room, payload, exceptId) {
  for (const member of room.participants.values()) if (member.id !== exceptId) send(member.socket, payload);
}
function broadcastState(room) { broadcast(room, { type: "room-state", room: publicRoom(room) }); }
function systemMessage(room, text) {
  const message = { id: randomUUID(), senderId: "system", sender: "System", avatar: "", text, timestamp: Date.now(), system: true };
  room.messages.push(message); broadcast(room, { type: "chat", message });
}
function rateOkay(socket, key, limit, windowMs) {
  const now = Date.now(); socket.rates ||= {};
  const values = (socket.rates[key] || []).filter((time) => now - time < windowMs);
  if (values.length >= limit) return false;
  values.push(now); socket.rates[key] = values; return true;
}

const server = createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ service: "An:me Watch Together", status: "ok", rooms: rooms.size }));
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 });
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const origin = request.headers.origin || "";
  if (url.pathname !== "/ws" || !allowedOrigins.has(origin)) return socket.destroy();
  wss.handleUpgrade(request, socket, head, (websocket) => wss.emit("connection", websocket));
});

wss.on("connection", (socket) => {
  socket.isAlive = true;
  socket.on("pong", () => { socket.isAlive = true; });
  socket.on("message", (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return send(socket, { type: "error", message: "Invalid request." }); }
    if (!rateOkay(socket, "actions", 30, 10_000)) return send(socket, { type: "error", message: "Too many actions." });

    if (data.type === "create" || data.type === "join") {
      const identity = identityFromToken(data.token);
      if (!identity) return send(socket, { type: "error", message: "Invalid or expired identity." });
      const code = data.type === "create" ? createRoomCode() : String(data.roomCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      let room = rooms.get(code);
      if (data.type === "create") {
        const animeId = Number(data.animeId), episode = Number(data.episode);
        if (!Number.isInteger(animeId) || animeId < 1 || !Number.isInteger(episode) || episode < 1) return send(socket, { type: "error", message: "Open an anime episode before creating a room." });
        room = { id: randomUUID(), code, hostId: identity.id, animeId, episode, currentTime: 0, playing: false, updatedAt: Date.now(), participants: new Map(), messages: [], createdAt: Date.now() };
        rooms.set(code, room);
      }
      if (!room) return send(socket, { type: "error", message: "Room not found." });
      if (room.participants.size >= 10 && !room.participants.has(identity.id)) return send(socket, { type: "error", message: "Room is full." });
      if (socket.room && socket.room !== room) return send(socket, { type: "error", message: "Leave the current room first." });
      const existing = room.participants.get(identity.id);
      if (existing?.disconnectTimer) clearTimeout(existing.disconnectTimer);
      const member = { id: identity.id, name: cleanText(identity.name).slice(0, 32), avatar: cleanText(identity.avatar).slice(0, 8), connected: true, socket };
      room.participants.set(identity.id, member); socket.room = room; socket.participantId = identity.id;
      send(socket, { type: data.type === "create" ? "created" : "joined", room: publicRoom(room) });
      if (!existing) systemMessage(room, `${member.name} joined the room.`);
      broadcastState(room); return;
    }

    const room = socket.room;
    if (!room || !socket.participantId || !room.participants.has(socket.participantId)) return send(socket, { type: "error", message: "Join a room first." });
    const isHost = room.hostId === socket.participantId;
    if (data.type === "control") {
      if (!isHost) return send(socket, { type: "error", message: "Only the host controls playback." });
      if (!["play", "pause", "seek", "episode", "sync"].includes(data.action)) return;
      if (data.action === "episode") {
        const episode = Number(data.episode); if (!Number.isInteger(episode) || episode < 1) return;
        room.episode = episode; room.currentTime = 0; room.playing = false;
      } else {
        const time = Number(data.currentTime);
        if (Number.isFinite(time) && time >= 0) room.currentTime = Math.min(time, 86400);
        if (data.action === "play") room.playing = true;
        if (data.action === "pause") room.playing = false;
        if (typeof data.playing === "boolean") room.playing = data.playing;
      }
      room.updatedAt = Date.now();
      broadcast(room, { type: "control", action: data.action, episode: room.episode, currentTime: room.currentTime, playing: room.playing, serverTime: room.updatedAt }, socket.participantId);
      return;
    }
    if (data.type === "chat") {
      if (!rateOkay(socket, "chat", 5, 10_000)) return send(socket, { type: "error", message: "Please slow down." });
      const text = cleanText(data.text); if (!text) return;
      const member = room.participants.get(socket.participantId);
      const message = { id: randomUUID(), senderId: member.id, sender: member.name, avatar: member.avatar, text, timestamp: Date.now() };
      room.messages.push(message); broadcast(room, { type: "chat", message }); return;
    }
    if (data.type === "transfer-host") {
      if (!isHost) return send(socket, { type: "error", message: "Only the host can transfer control." });
      const target = room.participants.get(String(data.participantId));
      if (!target?.connected) return send(socket, { type: "error", message: "Participant is unavailable." });
      room.hostId = target.id; systemMessage(room, `${target.name} is now the host.`); broadcastState(room); return;
    }
    if (data.type === "end-room") {
      if (!isHost) return send(socket, { type: "error", message: "Only the host can end the room." });
      broadcast(room, { type: "ended", message: "The host ended the room." }); rooms.delete(room.code);
      for (const member of room.participants.values()) member.socket?.close(); return;
    }
    if (data.type === "leave") socket.close();
  });

  socket.on("close", () => {
    const room = socket.room, member = room?.participants.get(socket.participantId);
    if (!room || !member || member.socket !== socket) return;
    member.connected = false; member.socket = null; broadcastState(room);
    member.disconnectTimer = setTimeout(() => {
      if (member.connected) return;
      room.participants.delete(member.id); systemMessage(room, `${member.name} left the room.`);
      if (room.participants.size === 0) return rooms.delete(room.code);
      if (room.hostId === member.id) {
        const nextHost = [...room.participants.values()].find((item) => item.connected);
        if (nextHost) { room.hostId = nextHost.id; systemMessage(room, `${nextHost.name} is now the host.`); }
        else { broadcast(room, { type: "ended", message: "The room ended because the host left." }); return rooms.delete(room.code); }
      }
      broadcastState(room);
    }, 15_000);
  });
});

setInterval(() => {
  for (const socket of wss.clients) {
    if (!socket.isAlive) { socket.terminate(); continue; }
    socket.isAlive = false; socket.ping();
  }
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms) if (room.createdAt < cutoff) { broadcast(room, { type: "ended", message: "Room expired." }); rooms.delete(code); }
}, 30_000).unref();

server.listen(port, "0.0.0.0", () => console.log(`An:me Watch Together listening on port ${port}`));
