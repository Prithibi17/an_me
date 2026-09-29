import { Anime, Character, RelationNode } from "./types";
import { filterAnime, isAllowedMetadata } from "./content-filter";

export function normalizeAnime(raw: any, rank?: number): Anime {
  if (!raw) {
    return {
      id: 0,
      title: { english: "Unknown", romaji: "Unknown" },
      coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop",
      genres: [],
      tags: [],
    };
  }

  const cover =
    raw.coverImage?.extraLarge ||
    raw.coverImage?.large ||
    raw.coverImage?.medium ||
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop";

  const studios = raw.studios?.nodes?.map((s: any) => s.name).filter(Boolean) || [];

  const characters: Character[] =
    raw.characters?.edges?.map((edge: any) => ({
      id: edge.node?.id,
      name: {
        full: edge.node?.name?.full || "Unknown",
        native: edge.node?.name?.native || null,
      },
      image: edge.node?.image || null,
      role: edge.role || "MAIN",
    })) || [];

  const relations: RelationNode[] =
    raw.relations?.edges
      ?.filter((edge: any) => edge.node?.type === "ANIME" && isAllowedMetadata(edge.node))
      ?.map((edge: any) => ({
        id: edge.node?.id,
        relationType: edge.relationType,
        format: edge.node?.format,
        status: edge.node?.status,
        isAdult: Boolean(edge.node?.isAdult),
        genres: edge.node?.genres || [],
        duration: edge.node?.duration || null,
        tags: edge.node?.tags || [],
        title: edge.node?.title || {},
        coverImage: edge.node?.coverImage || null,
      })) || [];

  const recommendations: Anime[] =
    raw.recommendations?.nodes
      ?.map((node: any) => node.mediaRecommendation)
      ?.filter(Boolean)
      ?.map((rec: any) => normalizeAnime(rec)) || [];
  const allowedRecommendations = filterAnime(recommendations);

  const nextAiringEpisode = raw.nextAiringEpisode
    ? {
        id: raw.nextAiringEpisode.id,
        airingAt: raw.nextAiringEpisode.airingAt,
        timeUntilAiring: raw.nextAiringEpisode.timeUntilAiring,
        episode: raw.nextAiringEpisode.episode,
      }
    : null;

  let latestAiredEpisode: number | null = null;
  if (typeof raw.latestEpisode === "number") {
    latestAiredEpisode = raw.latestEpisode;
  } else if (nextAiringEpisode && nextAiringEpisode.episode > 1) {
    latestAiredEpisode = nextAiringEpisode.episode - 1;
  } else if (nextAiringEpisode && nextAiringEpisode.episode === 1) {
    latestAiredEpisode = 0;
  } else if (raw.status === "FINISHED") {
    latestAiredEpisode = raw.episodes || null;
  } else if (raw.status === "NOT_YET_RELEASED") {
    latestAiredEpisode = 0;
  }

  return {
    id: raw.id,
    title: {
      english: raw.title?.english || null,
      romaji: raw.title?.romaji || null,
      native: raw.title?.native || null,
    },
    coverImage: cover,
    coverColor: raw.coverImage?.color || null,
    bannerImage: raw.bannerImage || null,
    description: raw.description || null,
    score: raw.averageScore || raw.meanScore || null,
    genres: raw.genres || [],
    tags: raw.tags?.map((tag: any) => ({ name: tag.name, rank: tag.rank ?? null })) || [],
    episodes: raw.episodes || null,
    duration: raw.duration || null,
    status: raw.status || null,
    isAdult: Boolean(raw.isAdult),
    format: raw.format || null,
    season: raw.season || null,
    seasonYear: raw.seasonYear || null,
    studios,
    source: raw.source || null,
    idMal: raw.idMal || null,
    characters: characters.length > 0 ? characters : undefined,
    relations: relations.length > 0 ? relations : undefined,
    recommendations: allowedRecommendations.length > 0 ? allowedRecommendations : undefined,
    streamingEpisodes: raw.streamingEpisodes || undefined,
    nextAiringEpisode,
    latestAiredEpisode,
    airingAt: raw.airingAt || null,
    rank,
  };
}
