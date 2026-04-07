/**
 * TanStack Query hook for process list data (D-29).
 */

import { useQuery } from "@tanstack/react-query";

import { fetchProcessList } from "../api/cockpit-api";

export function useProcessList(period: string) {
  return useQuery({
    queryKey: ["cockpit", "processes", period],
    queryFn: () => fetchProcessList(period),
    staleTime: 60_000,
  });
}
