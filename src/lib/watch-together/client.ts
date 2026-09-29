export interface WatchParticipant { id: string; name: string; avatar: string; connected: boolean }
export interface WatchMessage { id: string; senderId: string; sender: string; avatar: string; text: string; timestamp: number; system?: boolean }
export interface WatchRoom {
  roomId: string; roomCode: string; hostId: string; animeId: number; episode: number;
  currentTime: number; playing: boolean; participants: WatchParticipant[];
  messages: WatchMessage[]; createdAt: number;
}
export interface WatchIdentity { id: string; name: string; avatar: string }

export async function getWatchIdentity() {
  const cached = sessionStorage.getItem("anme_watch_identity");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const payload = JSON.parse(atob(parsed.token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.exp > Date.now() + 60_000) return parsed as { token: string; identity: WatchIdentity };
    } catch {}
  }
  const response = await fetch("/api/watch-together/identity", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not create room identity.");
  const result = await response.json();
  sessionStorage.setItem("anme_watch_identity", JSON.stringify(result));
  return result as { token: string; identity: WatchIdentity };
}

export function watchSocketUrl() {
  const configured = process.env.NEXT_PUBLIC_WATCH_TOGETHER_WS_URL;
  if (configured) return configured;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return process.env.NODE_ENV === "development"
    ? `${protocol}//${window.location.hostname}:3002/ws`
    : `${protocol}//${window.location.host}/api/watch-together/ws`;
}

export async function openWatchSocket() {
  const identity = await getWatchIdentity();
  const socket = new WebSocket(watchSocketUrl());
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Connection timed out.")), 8000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Could not connect to Watch Together.")); }, { once: true });
  });
  return { socket, ...identity };
}

export function waitForRoom(socket: WebSocket) {
  return new Promise<WatchRoom>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Room request timed out.")), 8000);
    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "created" || data.type === "joined") {
        clearTimeout(timer); socket.removeEventListener("message", handler); resolve(data.room);
      } else if (data.type === "error") {
        clearTimeout(timer); socket.removeEventListener("message", handler); reject(new Error(data.message));
      }
    };
    socket.addEventListener("message", handler);
  });
}
