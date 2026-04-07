/**
 * TanStack Query hook for node duration analytics (D-17).
 *
 * Wraps fetchNodeDurationStats with query key [analytics, nodeDuration, processId, period].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchNodeDurationStats } from "../api/cockpit-api";

export function useAnalyticsDuration(processDefinitionKey: string, period: string) {
  return useQuery({
    queryKey: ["analytics", "nodeDuration", processDefinitionKey, period],
    queryFn: () => fetchNodeDurationStats(processDefinitionKey, period),
    enabled: !!processDefinitionKey,
    staleTime: 60_000,
  });
}
