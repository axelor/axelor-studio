/**
 * Shared formatting utilities for the cockpit.
 */

/**
 * Format a duration in milliseconds to a human-readable string.
 * Examples: "2h 15m", "45m", "30s", "< 1s"
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return "-";
  if (ms < 1000) return "< 1s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format ISO timestamp to relative time.
 * Under 60s: "Just now". Under 60m: "2m ago". Under 24h: "5h ago". Over 24h: "3d ago".
 */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format an ISO date string to locale short format.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
