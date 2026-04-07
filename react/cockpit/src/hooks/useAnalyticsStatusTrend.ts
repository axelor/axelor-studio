/**
 * TanStack Query hook for status trend analytics (D-16).
 *
 * Wraps fetchStatusTrend with query key [analytics, statusTrend, processId, period].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchStatusTrend } from "../api/cockpit-api";

export function useAnalyticsStatusTrend(processDefinitionKey: string, period: string) {
  return useQuery({
    queryKey: ["analytics", "statusTrend", processDefinitionKey, period],
    queryFn: () => fetchStatusTrend(processDefinitionKey, period),
    enabled: !!processDefinitionKey,
    staleTime: 60_000,
  });
}
