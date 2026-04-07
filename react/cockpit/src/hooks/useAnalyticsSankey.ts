/**
 * TanStack Query hook for Sankey transition analytics (D-18).
 *
 * Wraps fetchSankeyData with query key [analytics, sankeyData, processId, period].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchSankeyData } from "../api/cockpit-api";

export function useAnalyticsSankey(processDefinitionKey: string, period: string) {
  return useQuery({
    queryKey: ["analytics", "sankeyData", processDefinitionKey, period],
    queryFn: () => fetchSankeyData(processDefinitionKey, period),
    enabled: !!processDefinitionKey,
    staleTime: 60_000,
  });
}
