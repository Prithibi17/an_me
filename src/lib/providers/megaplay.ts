import { EpisodeItem, PlaybackProvider, PlayerConfig } from "./playback-provider";

export class MegaPlayProvider implements PlaybackProvider {
  id = "megaplay";
  name = "Server 2 (MegaPlay)";

  getEmbedUrl(config: PlayerConfig): string {
    const {
      source = "anilist",
      animeId,
      episode,
      track = "sub",
    } = config;

    const sourceSlug = source === "mal" ? "mal" : "ani";
    const language = track === "dub" ? "dub" : "sub";

    return "https://megaplay.buzz/stream/" + sourceSlug + "/" + animeId + "/" + episode + "/" + language;
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

export const megaplayProvider = new MegaPlayProvider();
