import { PlaybackProvider } from "./playback-provider";
import { zokoanimeProvider } from "./zokoanime";
import { megaplayProvider } from "./megaplay";

export * from "./playback-provider";
export * from "./zokoanime";
export * from "./megaplay";

export interface ServerOption {
  id: string;
  name: string;
  badge: string;
  providerId: "megaplay" | "zokoanime";
  source: "anilist" | "mal";
}

export const AVAILABLE_SERVERS: ServerOption[] = [
  { id: "megaplay-ani", name: "MegaPlay · AniList", badge: "Mega A" , providerId: "megaplay", source: "anilist" },
  { id: "megaplay-mal", name: "MegaPlay · MAL", badge: "Mega M", providerId: "megaplay", source: "mal" },
  { id: "zokoanime-ani", name: "Zoko · AniList", badge: "Zoko A", providerId: "zokoanime", source: "anilist" },
  { id: "zokoanime-mal", name: "Zoko · MAL", badge: "Zoko M", providerId: "zokoanime", source: "mal" },
];

const providers: Record<string, PlaybackProvider> = {
  megaplay: megaplayProvider,
  zokoanime: zokoanimeProvider,
};

export function getDefaultPlaybackProvider(): PlaybackProvider {
  return megaplayProvider;
}

export function getPlaybackProvider(id: string): PlaybackProvider {
  const providerId = AVAILABLE_SERVERS.find((server) => server.id === id)?.providerId || id;
  return providers[providerId] || megaplayProvider;
}

export function getServerOption(id: string): ServerOption | null {
  return AVAILABLE_SERVERS.find((server) => server.id === id) || null;
}
