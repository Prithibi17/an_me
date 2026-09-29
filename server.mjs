import { createServer } from "node:http";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";

const dev = process.env.NODE_ENV !== "production" && process.env.npm_lifecycle_event !== "start";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3001);
const secret = process.env.WATCH_TOGETHER_SECRET || "anme-watch-together-local-secret";
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const rooms = new Map();
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const encode = (value) => Buffer.from(value).toString("base64url");
const sign = (payload) => createHmac("sha256", secret).update(payload).digest("base64url");
function identityFromToken(token) {
  if (typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const identity = JSON.parse(Buffer.from(payload, "base64url").toString());
    return identity.exp > Date.now() && identity.id && identity.name ? identity : null;
  } catch { return null; }
}
function roomCode() {
  let code;
  do { code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(""); }
  while (rooms.has(code));
  return code;
}
function cleanText(value) {
  return String(value || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 300);
}
function publicRoom(room) {
  const elapsed = room.playing ? (Date.now() - room.updatedAt) / 1000 : 0;
  return {
    roomId: room.id, roomCode: room.code, hostId: room.hostId,
    animeId: room.animeId, episode: room.episode,
    currentTime: Math.max(0, room.currentTime + elapsed), playing: room.playing,
    participants: [...room.participants.values()].map(({ id, name, avatar, connected }) => ({ id, name, avatar, connected })),
    messages: room.messages.slice(-100), createdAt: room.createdAt,
  };
}
function send(ws, payload) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}
function broadcast(room, payload) {
  for (const member of room.participants.values()) send(member.ws, payload);
}
function broadcastExcept(room, participantId, payload) {
  for (const member of room.participants.values()) if (member.id !== participantId) send(member.ws, payload);
}
function broadcastState(room) { broadcast(room, { type: "room-state", room: publicRoom(room) }); }
function systemMessage(room, text) {
  const message = { id: randomUUID(), senderId: "system", sender: "System", avatar: "", text, timestamp: Date.now(), system: true };
  room.messages.push(message);
  broadcast(room, { type: "chat", message });
}
function rateOkay(ws, key, limit, windowMs) {
  const now = Date.now();
  ws.rates ||= {};
  const values = (ws.rates[key] || []).filter((time) => now - time < windowMs);
  if (values.length >= limit) return false;
  values.push(now); ws.rates[key] = values; return true;
}

await app.prepare();
const server = createServer((req, res) => handle(req, res));
const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (url.pathname !== "/api/watch-together/ws") return socket.destroy();
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws));
});

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });
  ws.on("message", (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return send(ws, { type: "error", message: "Invalid request." }); }
    if (!rateOkay(ws, "actions", 30, 10_000)) return send(ws, { type: "error", message: "Too many actions." });

    if (data.type === "create" || data.type === "join") {
      const identity = identityFromToken(data.token);
      if (!identity) return send(ws, { type: "error", message: "Invalid or expired identity." });
      const code = data.type === "create" ? roomCode() : String(data.roomCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      let room = rooms.get(code);
      if (data.type === "create") {
        const animeId = Number(data.animeId), episode = Number(data.episode);
        if (!Number.isInteger(animeId) || animeId < 1 || !Number.isInteger(episode) || episode < 1) return send(ws, { type: "error", message: "Open an anime episode before creating a room." });
        room = { id: randomUUID(), code, hostId: identity.id, animeId, episode, currentTime: 0, playing: false, updatedAt: Date.now(), participants: new Map(), messages: [], createdAt: Date.now() };
        rooms.set(code, room);
      }
      if (!room) return send(ws, { type: "error", message: "Room not found." });
      if (room.participants.size >= 10 && !room.participants.has(identity.id)) return send(ws, { type: "error", message: "Room is full." });
      if (ws.room && ws.room !== room) return send(ws, { type: "error", message: "Leave the current room first." });

      const existing = room.participants.get(identity.id);
      if (existing?.disconnectTimer) clearTimeout(existing.disconnectTimer);
      const member = { id: identity.id, name: cleanText(identity.name).slice(0, 32), avatar: cleanText(identity.avatar).slice(0, 8), connected: true, ws };
      room.participants.set(identity.id, member);
      ws.room = room; ws.participantId = identity.id;
      send(ws, { type: data.type === "create" ? "created" : "joined", room: publicRoom(room) });
      if (!existing) systemMessage(room, `${member.name} joined the room.`);
      broadcastState(room);
      return;
    }

    const room = ws.room;
    if (!room || !ws.participantId || !room.participants.has(ws.participantId)) return send(ws, { type: "error", message: "Join a room first." });
    const isHost = room.hostId === ws.participantId;
    if (data.type === "control") {
      if (!isHost) return send(ws, { type: "error", message: "Only the host controls playback." });
      const action = data.action;
      if (!["play", "pause", "seek", "episode", "sync"].includes(action)) return;
      if (action === "episode") {
        const episode = Number(data.episode);
        if (!Number.isInteger(episode) || episode < 1) return;
        room.episode = episode; room.currentTime = 0; room.playing = false;
      } else {
        const time = Number(data.currentTime);
        if (Number.isFinite(time) && time >= 0) room.currentTime = Math.min(time, 86400);
        if (action === "play") room.playing = true;
        if (action === "pause") room.playing = false;
        if (typeof data.playing === "boolean") room.playing = data.playing;
      }
      room.updatedAt = Date.now();
      broadcastExcept(room, ws.participantId, { type: "control", action, episode: room.episode, currentTime: room.currentTime, playing: room.playing, serverTime: room.updatedAt });
      return;
    }
    if (data.type === "chat") {
      if (!rateOkay(ws, "chat", 5, 10_000)) return send(ws, { type: "error", message: "Please slow down." });
      const text = cleanText(data.text);
      if (!text) return;
      const member = room.participants.get(ws.participantId);
      const message = { id: randomUUID(), senderId: member.id, sender: member.name, avatar: member.avatar, text, timestamp: Date.now() };
      room.messages.push(message); broadcast(room, { type: "chat", message }); return;
    }
    if (data.type === "transfer-host") {
      if (!isHost) return send(ws, { type: "error", message: "Only the host can transfer control." });
      const target = room.participants.get(String(data.participantId));
      if (!target?.connected) return send(ws, { type: "error", message: "Participant is unavailable." });
      room.hostId = target.id; systemMessage(room, `${target.name} is now the host.`); broadcastState(room); return;
    }
    if (data.type === "end-room") {
      if (!isHost) return send(ws, { type: "error", message: "Only the host can end the room." });
      broadcast(room, { type: "ended", message: "The host ended the room." }); rooms.delete(room.code);
      for (const member of room.participants.values()) member.ws?.close(); return;
    }
    if (data.type === "leave") ws.close();
  });

  ws.on("close", () => {
    const room = ws.room;
    const member = room?.participants.get(ws.participantId);
    if (!room || !member || member.ws !== ws) return;
    member.connected = false; member.ws = null;
    broadcastState(room);
    member.disconnectTimer = setTimeout(() => {
      if (member.connected) return;
      room.participants.delete(member.id);
      systemMessage(room, `${member.name} left the room.`);
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
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms) if (room.createdAt < cutoff) { broadcast(room, { type: "ended", message: "Room expired." }); rooms.delete(code); }
}, 30_000).unref();

server.listen(port, hostname, () => console.log(`> An:me ready on http://localhost:${port}`));
