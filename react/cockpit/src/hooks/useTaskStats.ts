/**
 * TanStack Query hook for task statistics data (D-29).
 */

import { useQuery } from "@tanstack/react-query";

import { fetchTaskStats } from "../api/cockpit-api";

export function useTaskStats(period: string) {
  return useQuery({
    queryKey: ["cockpit", "taskStats", period],
    queryFn: () => fetchTaskStats(period),
    staleTime: 60_000,
  });
}
