export type PlaybackServerId = "megaplay-ani" | "megaplay-mal" | "zokoanime-ani" | "zokoanime-mal" | "anikoto";

export function serverOrder(hasCatalogEpisodeSource: boolean, hasMalId = true): PlaybackServerId[] {
  const resolvers: PlaybackServerId[] = ["megaplay-ani"];
  if (hasMalId) resolvers.push("megaplay-mal");
  resolvers.push("zokoanime-ani");
  if (hasMalId) resolvers.push("zokoanime-mal");
  if (hasCatalogEpisodeSource) resolvers.push("anikoto");
  return resolvers;
}

export function choosePlaybackServer(
  preferred: string | null | undefined,
  hasCatalogEpisodeSource: boolean,
  hasMalId = true,
): PlaybackServerId {
  const order = serverOrder(hasCatalogEpisodeSource, hasMalId);
  return order.includes(preferred as PlaybackServerId)
    ? preferred as PlaybackServerId
    : order[0];
}

export function nextPlaybackServer(
  current: string,
  hasCatalogEpisodeSource: boolean,
  hasMalId = true,
): PlaybackServerId {
  const order = serverOrder(hasCatalogEpisodeSource, hasMalId);
  const index = order.indexOf(current as PlaybackServerId);
  return order[(index + 1 + order.length) % order.length];
}
