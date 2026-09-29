export interface EpisodeItem {
  number: number;
  title: string;
  thumbnail?: string;
  duration?: number;
  rating?: number;
}

export type PlaybackTrack = "sub" | "dub" | "hsub";

export interface PlayerConfig {
  source?: "anilist" | "mal";
  animeId: number;
  episode: number;
  track?: PlaybackTrack;
  startTime?: number;
  accentColor?: string;
  autoplay?: boolean;
  muted?: boolean;
  resume?: boolean;
  asi?: boolean;
  autonext?: boolean;
}

export interface PlaybackProvider {
  id: string;
  name: string;
  getEmbedUrl(config: PlayerConfig): string;
  getEpisodes(
    animeId: number,
    totalEpisodes?: number | null,
    animeTitle?: string,
    streamingEpisodes?: any[],
    bannerFallback?: string | null,
    coverFallback?: string | null,
    status?: string | null,
    latestAiredEpisode?: number | null
  ): Promise<EpisodeItem[]>;
}
