const COMMON_TITLE_WORDS = [
  "attack", "bleach", "boruto", "chainsaw", "clover", "demon", "dragon",
  "family", "gintama", "haikyuu", "hunter", "jujutsu", "kaisen", "naruto",
  "overlord", "piece", "slayer", "solo", "spy", "sword", "tokyo",
];

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

export function editDistance(left: string, right: string) {
  const a = normalize(left);
  const b = normalize(right);
  const rows = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let column = 1; column <= b.length; column += 1) {
    let previous = rows[0];
    rows[0] = column;
    for (let row = 1; row <= a.length; row += 1) {
      const saved = rows[row];
      rows[row] = Math.min(rows[row] + 1, rows[row - 1] + 1, previous + (a[row - 1] === b[column - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return rows[a.length];
}

export function deterministicCorrections(query: string) {
  const normalized = normalize(query);
  if (!normalized) return [];
  const corrected = normalized.split(" ").map((word) => {
    if (word.length < 4 || COMMON_TITLE_WORDS.includes(word)) return word;
    const match = COMMON_TITLE_WORDS
      .map((candidate) => ({ candidate, distance: editDistance(word, candidate) }))
      .filter(({ candidate, distance }) => distance <= (candidate.length >= 5 ? 2 : 1))
      .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))[0];
    return match?.candidate || word;
  }).join(" ");
  return corrected !== normalized ? [corrected] : [];
}

export function sameNormalizedQuery(left: string, right: string) {
  return normalize(left) === normalize(right);
}
