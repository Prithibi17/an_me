import { EpisodeItem, PlaybackProvider, PlayerConfig } from "./playback-provider";

export class ZokoanimeProvider implements PlaybackProvider {
  id = "zokoanime";
  name = "Zokoanime Player";

  getEmbedUrl(config: PlayerConfig): string {
    const {
      source = "anilist",
      animeId,
      episode,
      track = "sub",
      startTime,
      accentColor = "7657FF",
      autoplay = true,
      muted = false,
      resume = true,
      asi = true,
      autonext = true,
    } = config;
    const sourceSlug = source === "mal" ? "mal" : "ani";
    const cleanColor = accentColor.replace("#", "").toLowerCase();

    const url = new URL(`https://zokoanime.video/stream/${sourceSlug}/${animeId}/${episode}/${track}`);
    url.searchParams.set("color", cleanColor);
    url.searchParams.set("autoplay", autoplay ? "true" : "false");
    if (muted) url.searchParams.set("muted", "1");
    if (!resume) url.searchParams.set("resume", "0");
    url.searchParams.set("asi", asi ? "1" : "0");
    url.searchParams.set("autonext", autonext ? "1" : "0");

    if (startTime && startTime > 0) {
      url.searchParams.set("time", Math.floor(startTime).toString());
    }

    return url.toString();
  }

  async getEpisodes(
    animeId: number,
    totalEpisodes?: number | null,
    animeTitle?: string,
    streamingEpisodes?: any[],
    bannerFallback?: string | null,
    coverFallback?: string | null,
    status?: string | null,
    latestAiredEpisode?: number | null
  ): Promise<EpisodeItem[]> {
    const { getRealEpisodes } = await import("../anilist/episodes");
    return getRealEpisodes(
      animeTitle || "Anime",
      totalEpisodes,
      streamingEpisodes,
      bannerFallback,
      coverFallback,
      status,
      latestAiredEpisode
    );
  }
}

export const zokoanimeProvider = new ZokoanimeProvider();
