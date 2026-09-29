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
}

export const AVAILABLE_SERVERS: ServerOption[] = [
  { id: "megaplay", name: "Server 1 (MegaPlay)", badge: "HD-1" },
  { id: "zokoanime", name: "Server 2 (Zoko)", badge: "HD-2" },
];

const providers: Record<string, PlaybackProvider> = {
  megaplay: megaplayProvider,
  zokoanime: zokoanimeProvider,
};

export function getDefaultPlaybackProvider(): PlaybackProvider {
  return megaplayProvider;
}

export function getPlaybackProvider(id: string): PlaybackProvider {
  return providers[id] || megaplayProvider;
}
