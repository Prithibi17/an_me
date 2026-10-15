import { isOpenRouterConfigured, requestOpenRouterJson } from "@/lib/openrouter/client";
import { deterministicCorrections, sameNormalizedQuery } from "./query-heuristics";

type CorrectionResponse = { corrections: string[] };

export async function getSearchCorrections(query: string, mediaType: "anime" | "manga") {
  const cleanQuery = query.trim().slice(0, 120);
  if (!cleanQuery) return [];

  const deterministic = deterministicCorrections(cleanQuery);
  // Known title-word typos should resolve immediately without paying the
  // latency/cost of a model call. The model is reserved for unfamiliar names.
  if (deterministic.length || !isOpenRouterConfigured()) return deterministic;

  try {
    const result = await requestOpenRouterJson<CorrectionResponse>({
      model: process.env.OPENROUTER_SEARCH_MODEL || "openrouter/free",
      messages: [
        {
          role: "system",
          content: `You correct misspelled ${mediaType} title searches. Return only likely title queries. Never invent a title and never change an already plausible title.`,
        },
        {
          role: "user",
          content: `Search text: ${JSON.stringify(cleanQuery)}. Return up to 3 corrected or closely related title queries.`,
        },
      ],
      schemaName: "title_search_corrections",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          corrections: { type: "array", maxItems: 3, items: { type: "string", minLength: 1, maxLength: 120 } },
        },
        required: ["corrections"],
      },
      maxTokens: 120,
      timeoutMs: 6_000,
    });
    return Array.from(new Set([
      ...deterministic,
      ...result.corrections.map((value) => value.trim()).filter(Boolean),
    ])).filter((value) => !sameNormalizedQuery(value, cleanQuery)).slice(0, 3);
  } catch (error) {
    console.warn("Search query enhancement unavailable; using catalog suggestions.", error instanceof Error ? error.message : "Unknown error");
    return deterministic;
  }
}
