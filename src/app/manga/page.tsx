import { MangaHome } from "@/components/manga/MangaHome";
import { getMangaList } from "@/lib/anilist/manga";

export const revalidate = 300;

export default async function MangaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const today = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
  const [trending, latest, upcoming, top, searchResults] = await Promise.all([
    getMangaList({ sort: ["TRENDING_DESC"], perPage: 12 }),
    getMangaList({ sort: ["UPDATED_AT_DESC"], status: "RELEASING", perPage: 12 }),
    getMangaList({ sort: ["START_DATE"], status: "NOT_YET_RELEASED", startDateGreater: today, perPage: 12 }),
    getMangaList({ sort: ["SCORE_DESC"], perPage: 10 }),
    q ? getMangaList({ search: q, sort: ["SEARCH_MATCH"], perPage: 12 }) : Promise.resolve({ media: [] }),
  ]);
  return <MangaHome trending={trending.media} latest={latest.media} upcoming={upcoming.media} top={top.media} searchResults={searchResults.media} searchQuery={q} />;
}
