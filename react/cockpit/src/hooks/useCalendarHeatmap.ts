/**
 * TanStack Query hook for calendar heatmap data.
 *
 * Wraps fetchCalendarHeatmap with query key [analytics, calendarHeatmap, period].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchCalendarHeatmap } from "../api/cockpit-api";

export function useCalendarHeatmap(period: string) {
  return useQuery({
    queryKey: ["analytics", "calendarHeatmap", period],
    queryFn: () => fetchCalendarHeatmap(period),
    staleTime: 60_000,
  });
}
