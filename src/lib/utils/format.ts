export function formatDuration(minutes?: number | null): string {
  if (!minutes) return "24m";
  if (minutes < 60) return minutes + "m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? hrs + "h " + mins + "m" : hrs + "h";
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hrs > 0) {
    return hrs + ":" + remainingMins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");
  }
  return mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");
}

export function formatScore(score?: number | null): string {
  if (!score) return "N/A";
  const normalized = (score / 10).toFixed(1);
  return normalized;
}

export function cleanDescription(rawDesc?: string | null): string {
  if (!rawDesc) return "";
  return rawDesc
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
