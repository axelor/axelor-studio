/**
 * TanStack Query hook for adoption overview data (D-29).
 */

import { useQuery } from "@tanstack/react-query";

import { fetchAdoptionOverview } from "../api/cockpit-api";

export function useAdoptionOverview(period: string) {
  return useQuery({
    queryKey: ["cockpit", "adoption", period],
    queryFn: () => fetchAdoptionOverview(period),
    staleTime: 60_000,
  });
}
