export function truncate(value: string, max: number): string {
  if (max <= 0) {
    return "";
  }
  if (value.length <= max) {
    return value;
  }
  if (max <= 3) {
    return value.slice(0, max);
  }
  return `${value.slice(0, max - 1)}...`;
}

export function cell(value: string | number, width: number): string {
  return truncate(String(value), width).padEnd(width, " ");
}

export function msToLap(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const millis = (ms % 1000).toString().padStart(3, "0");
  return `${mins}:${secs}.${millis}`;
}

export function msToGap(ms: number): string {
  return ms === 0 ? "LEADER" : `+${(ms / 1000).toFixed(3)}s`;
}

export function formatWeekendRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.toLocaleString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export function pointsBar(points: number, max: number, width: number): string {
  const safeWidth = Math.max(4, width);
  const filled = Math.max(1, Math.round((points / max) * safeWidth));
  return `${"#".repeat(filled)}${".".repeat(Math.max(0, safeWidth - filled))}`;
}
