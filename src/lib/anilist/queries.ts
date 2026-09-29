export const MEDIA_FIELDS_FRAGMENT = `
  id
  title {
    english
    romaji
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description(asHtml: false)
  averageScore
  meanScore
  genres
  tags {
    name
    rank
  }
  episodes
  duration
  status
  isAdult
  format
  season
  seasonYear
  studios(isMain: true) {
    nodes {
      id
      name
    }
  }
  nextAiringEpisode {
    id
    airingAt
    timeUntilAiring
    episode
  }
`;

export const TRENDING_QUERY = `
  query GetTrending($page: Int = 1, $perPage: Int = 10) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
        ${MEDIA_FIELDS_FRAGMENT}
      }
    }
  }
`;

export const POPULAR_SEASON_QUERY = `
  query GetPopularSeason($page: Int = 1, $perPage: Int = 10, $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FIELDS_FRAGMENT}
      }
    }
  }
`;

export const TOP_RATED_QUERY = `
  query GetTopRated($page: Int = 1, $perPage: Int = 10) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
        ${MEDIA_FIELDS_FRAGMENT}
      }
    }
  }
`;

export const SEARCH_QUERY = `
  query SearchAnime(
    $search: String,
    $genre: String,
    $genre_in: [String],
    $tag_in: [String],
    $seasonYear: Int,
    $season: MediaSeason,
    $format: MediaFormat,
    $status: MediaStatus,
    $averageScore_greater: Int,
    $startDate_greater: FuzzyDateInt,
    $startDate_lesser: FuzzyDateInt,
    $sort: [MediaSort] = [TRENDING_DESC],
    $page: Int = 1,
    $perPage: Int = 24
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(
        type: ANIME,
        search: $search,
        genre: $genre,
        genre_in: $genre_in,
        tag_in: $tag_in,
        seasonYear: $seasonYear,
        season: $season,
        format: $format,
        status: $status,
        averageScore_greater: $averageScore_greater,
        startDate_greater: $startDate_greater,
        startDate_lesser: $startDate_lesser,
        sort: $sort,
        isAdult: false
      ) {
        ${MEDIA_FIELDS_FRAGMENT}
      }
    }
  }
`;

export const ANIME_DETAILS_QUERY = `
  query GetAnimeDetails($id: Int!) {
    Media(id: $id, type: ANIME) {
      ${MEDIA_FIELDS_FRAGMENT}
      source
      characters(role: MAIN, perPage: 12) {
        edges {
          role
          node {
            id
            name {
              full
              native
            }
            image {
              large
              medium
            }
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            type
            format
            status
            isAdult
            genres
            duration
            tags {
              name
              rank
            }
            title {
              english
              romaji
              native
            }
            coverImage {
              large
              medium
            }
          }
        }
      }
      idMal
      streamingEpisodes {
        title
        thumbnail
        url
        site
      }
      recommendations(perPage: 10, sort: RATING_DESC) {
        nodes {
          mediaRecommendation {
            ${MEDIA_FIELDS_FRAGMENT}
          }
        }
      }
    }
  }
`;

export const RECENTLY_AIRED_QUERY = `
  query GetRecentlyAired($page: Int = 1, $perPage: Int = 20, $airingAt_lesser: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      airingSchedules(airingAt_lesser: $airingAt_lesser, sort: TIME_DESC) {
        id
        airingAt
        episode
        timeUntilAiring
        media {
          ${MEDIA_FIELDS_FRAGMENT}
        }
      }
    }
  }
`;

export const AIRING_SCHEDULE_QUERY = `
  query GetAiringSchedule($start: Int, $end: Int, $perPage: Int = 50) {
    Page(page: 1, perPage: $perPage) {
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        id
        airingAt
        episode
        timeUntilAiring
        media {
          ${MEDIA_FIELDS_FRAGMENT}
        }
      }
    }
  }
`;

