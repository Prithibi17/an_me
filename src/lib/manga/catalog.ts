import "server-only";
import { resolveKuhiManga, type KuhiMangaInfo } from "@/lib/kuhi/client";
import { getMangaDexCatalog } from "@/lib/mangadex/client";

export async function resolveMangaCatalog(title: string, type?: string | null): Promise<KuhiMangaInfo | null> {
  const kuhi = await resolveKuhiManga(title, type);
  if (kuhi?.chapters?.length) return kuhi;

  const mangaDex = await getMangaDexCatalog(title);
  if (!mangaDex) return null;
  return {
    title,
    slug: mangaDex.mangaId,
    source: "mangadex",
    total_chapters: mangaDex.chapters.length,
    chapters: mangaDex.chapters,
  };
}

export async function resolveMangaCatalogFromTitles(titles: Array<string | null | undefined>, type?: string | null) {
  const unique = [...new Set(titles.map((title) => title?.trim()).filter((title): title is string => Boolean(title)))];
  for (const title of unique) {
    const catalog = await resolveMangaCatalog(title, type);
    if (catalog?.chapters?.length) return catalog;
  }
  return null;
}
