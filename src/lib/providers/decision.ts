export type PlaybackServerId = "megaplay" | "zokoanime" | "anikoto";

export function serverOrder(hasChineseEpisodeSource: boolean): PlaybackServerId[] {
  return hasChineseEpisodeSource
    ? ["anikoto", "megaplay", "zokoanime"]
    : ["megaplay", "zokoanime"];
}

export function choosePlaybackServer(
  preferred: string | null | undefined,
  hasChineseEpisodeSource: boolean,
): PlaybackServerId {
  const order = serverOrder(hasChineseEpisodeSource);
  return order.includes(preferred as PlaybackServerId)
    ? preferred as PlaybackServerId
    : order[0];
}

export function nextPlaybackServer(
  current: string,
  hasChineseEpisodeSource: boolean,
): PlaybackServerId {
  const order = serverOrder(hasChineseEpisodeSource);
  const index = order.indexOf(current as PlaybackServerId);
  return order[(index + 1 + order.length) % order.length];
}
