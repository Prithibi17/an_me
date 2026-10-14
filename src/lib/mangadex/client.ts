const API_ROOT = "https://api.mangadex.org";
const COVER_ROOT = "https://uploads.mangadex.org/covers";

export interface ChapterRelease {
  id: string;
  mangaId: string;
  title: string;
  chapter: string | null;
  chapterTitle: string | null;
  volume: string | null;
  readableAt: string;
  language: string;
  publicationType: "Manga" | "Manhwa" | "Manhua" | "Comic";
  coverImage: string | null;
  sourceUrl: string;
}

export interface MangaDexChapterPages {
  pages: string[];
}

export interface MangaDexCatalogChapter {
  id: string;
  number: string;
  title: string | null;
  is_locked: false;
  release_date: string;
}

interface RawMangaAttributes {
  title?: Record<string, string>;
  altTitles?: Array<Record<string, string>>;
  originalLanguage?: string;
}
interface Relationship { id: string; type: string; attributes?: RawMangaAttributes | { fileName?: string } }
interface RawChapter { id: string; attributes: { chapter?: string | null; title?: string | null; volume?: string | null; readableAt: string; translatedLanguage: string }; relationships: Relationship[] }
interface RawManga { id: string; attributes: RawMangaAttributes; relationships: Relationship[] }

function typeFromLanguage(language?: string): ChapterRelease["publicationType"] {
  if (language === "ko") return "Manhwa";
  if (language === "zh" || language === "zh-hk") return "Manhua";
  if (language === "ja") return "Manga";
  return "Comic";
}

function preferredTitle(attributes?: RawMangaAttributes) {
  if (!attributes) return "Untitled comic";
  const candidates = [attributes.title?.en, attributes.title?.["ja-ro"], attributes.title?.["ko-ro"], attributes.title?.["zh-ro"], ...((attributes.altTitles || []).map((title) => title.en).filter(Boolean)), ...Object.values(attributes.title || {})];
  return candidates.find(Boolean) || "Untitled comic";
}

function comparableTitle(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/^(the|a|an)\s+/, "");
}

async function mangaDexFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, { headers: { Accept: "application/json", "User-Agent": "Anme/1.0" }, next: { revalidate: 60 }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`MangaDex request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getMangaDexChapterPages(chapterId: string): Promise<MangaDexChapterPages | null> {
  try {
    const payload = await mangaDexFetch<{
      baseUrl: string;
      chapter: { hash: string; data: string[]; dataSaver: string[] };
    }>(`/at-home/server/${encodeURIComponent(chapterId)}`);
    const files = payload.chapter.dataSaver?.length ? payload.chapter.dataSaver : payload.chapter.data;
    const quality = payload.chapter.dataSaver?.length ? "data-saver" : "data";
    return { pages: files.map((file) => `${payload.baseUrl}/${quality}/${payload.chapter.hash}/${file}`) };
  } catch (error) {
    console.error(`Failed to load MangaDex chapter ${chapterId}:`, error);
    return null;
  }
}

export async function findMangaDexChapterPages(title: string, chapterNumber: string): Promise<MangaDexChapterPages | null> {
  try {
    const mangaQuery = new URLSearchParams({ title, limit: "10" });
    const manga = await mangaDexFetch<{ data: RawManga[] }>(`/manga?${mangaQuery}`);
    const wanted = title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/^(the|a|an)\s+/, "");
    const match = manga.data.find((item) => preferredTitle(item.attributes).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/^(the|a|an)\s+/, "") === wanted);
    if (!match) return null;
    const chapterQuery = new URLSearchParams({ manga: match.id, chapter: chapterNumber, limit: "1" });
    chapterQuery.append("translatedLanguage[]", "en");
    chapterQuery.append("contentRating[]", "safe");
    chapterQuery.append("contentRating[]", "suggestive");
    const chapters = await mangaDexFetch<{ data: RawChapter[] }>(`/chapter?${chapterQuery}`);
    return chapters.data[0] ? getMangaDexChapterPages(chapters.data[0].id) : null;
  } catch (error) {
    console.error(`Failed to find MangaDex chapter ${chapterNumber} for ${title}:`, error);
    return null;
  }
}

export async function getMangaDexCatalog(title: string): Promise<{ mangaId: string; chapters: MangaDexCatalogChapter[] } | null> {
  try {
    const mangaQuery = new URLSearchParams({ title, limit: "20" });
    const manga = await mangaDexFetch<{ data: RawManga[] }>(`/manga?${mangaQuery}`);
    const wanted = comparableTitle(title);
    const match = manga.data.find((item) => comparableTitle(preferredTitle(item.attributes)) === wanted);
    if (!match) return null;

    const all: RawChapter[] = [];
    let offset = 0;
    let total = 1;
    while (offset < total && offset < 2_000) {
      const query = new URLSearchParams({ manga: match.id, limit: "100", offset: String(offset) });
      query.append("translatedLanguage[]", "en");
      query.append("contentRating[]", "safe");
      query.append("contentRating[]", "suggestive");
      query.set("order[chapter]", "asc");
      const response = await mangaDexFetch<{ data: RawChapter[]; total: number }>(`/chapter?${query}`);
      all.push(...response.data);
      total = response.total;
      offset += response.data.length;
      if (!response.data.length) break;
    }

    const byNumber = new Map<string, MangaDexCatalogChapter>();
    for (const chapter of all) {
      const number = chapter.attributes.chapter;
      if (!number || byNumber.has(number)) continue;
      byNumber.set(number, {
        id: chapter.id,
        number,
        title: chapter.attributes.title || null,
        is_locked: false,
        release_date: chapter.attributes.readableAt,
      });
    }
    const chapters = [...byNumber.values()].sort((a, b) => Number(a.number) - Number(b.number));
    return chapters.length ? { mangaId: match.id, chapters } : null;
  } catch (error) {
    console.error(`Failed to load MangaDex catalog for ${title}:`, error);
    return null;
  }
}

export async function getLatestChapterReleases(limit = 18): Promise<ChapterRelease[]> {
  try {
    // Pull a wider chronological window so the mixed feed can include the
    // newest Korean and Chinese releases even during manga-heavy upload hours.
    const params = new URLSearchParams({ limit: "100" });
    params.append("translatedLanguage[]", "en");
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");
    params.append("includes[]", "manga");
    params.set("order[readableAt]", "desc");
    const chapters = await mangaDexFetch<{ data: RawChapter[] }>(`/chapter?${params}`);
    const now = Date.now();
    const eligibleWindow = (chapters.data || []).filter((chapter) => {
      const timestamp = Date.parse(chapter.attributes.readableAt);
      return Number.isFinite(timestamp) && timestamp <= now;
    });
    const selected = eligibleWindow.slice(0, limit);
    const represented = new Set(selected.map((chapter) => {
      const manga = chapter.relationships.find((item) => item.type === "manga");
      return typeFromLanguage((manga?.attributes as RawMangaAttributes | undefined)?.originalLanguage);
    }));
    for (const type of ["Manhwa", "Manhua"] as const) {
      if (represented.has(type)) continue;
      const supplement = eligibleWindow.find((chapter) => {
        const manga = chapter.relationships.find((item) => item.type === "manga");
        return typeFromLanguage((manga?.attributes as RawMangaAttributes | undefined)?.originalLanguage) === type;
      });
      if (supplement) selected.push(supplement);
    }
    const eligible = selected.sort((a, b) => Date.parse(b.attributes.readableAt) - Date.parse(a.attributes.readableAt));
    const mangaIds = Array.from(new Set(eligible.map((chapter) => chapter.relationships.find((relationship) => relationship.type === "manga")?.id).filter((id): id is string => Boolean(id))));
    const mangaParams = new URLSearchParams({ limit: String(Math.max(1, mangaIds.length)) });
    mangaIds.forEach((id) => mangaParams.append("ids[]", id));
    mangaParams.append("includes[]", "cover_art");
    const mangaResponse = mangaIds.length ? await mangaDexFetch<{ data: RawManga[] }>(`/manga?${mangaParams}`) : { data: [] };
    const mangaById = new Map(mangaResponse.data.map((manga) => [manga.id, manga]));
    return eligible.flatMap((chapter) => {
      const relationship = chapter.relationships.find((item) => item.type === "manga");
      if (!relationship) return [];
      const manga = mangaById.get(relationship.id);
      const attributes = manga?.attributes || relationship.attributes as RawMangaAttributes | undefined;
      const cover = manga?.relationships.find((item) => item.type === "cover_art")?.attributes as { fileName?: string } | undefined;
      return [{ id: chapter.id, mangaId: relationship.id, title: preferredTitle(attributes), chapter: chapter.attributes.chapter || null, chapterTitle: chapter.attributes.title || null, volume: chapter.attributes.volume || null, readableAt: chapter.attributes.readableAt, language: chapter.attributes.translatedLanguage, publicationType: typeFromLanguage(attributes?.originalLanguage), coverImage: cover?.fileName ? `${COVER_ROOT}/${relationship.id}/${cover.fileName}.256.jpg` : null, sourceUrl: `https://mangadex.org/chapter/${chapter.id}` } satisfies ChapterRelease];
    });
  } catch (error) {
    console.error("Failed to load latest MangaDex chapters:", error);
    return [];
  }
}
