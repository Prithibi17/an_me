const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

type OpenRouterTool = {
  type: "openrouter:web_search";
  parameters?: Record<string, unknown>;
};

type OpenRouterPlugin = {
  id: "web" | "response-healing";
  max_results?: number;
};

interface JsonRequestOptions {
  model?: string;
  messages: OpenRouterMessage[];
  schemaName: string;
  schema: Record<string, unknown>;
  tools?: OpenRouterTool[];
  plugins?: OpenRouterPlugin[];
  maxTokens?: number;
}

function parseJsonPayload<T>(content: string): T {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(normalized) as T;
}

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export async function requestOpenRouterJson<T>({
  model,
  messages,
  schemaName,
  schema,
  tools,
  plugins,
  maxTokens = 1800,
}: JsonRequestOptions): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
        "X-Title": "An:me",
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_MODEL || "openrouter/auto",
        messages,
        tools,
        plugins,
        max_tokens: maxTokens,
        temperature: 0.2,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema,
          },
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}): ${body.slice(0, 240)}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string"
      ? rawContent
      : rawContent?.map((part) => part.text || "").join("") || "";
    if (!content) {
      throw new Error("OpenRouter returned an empty response.");
    }
    return parseJsonPayload<T>(content);
  } finally {
    clearTimeout(timeout);
  }
}
