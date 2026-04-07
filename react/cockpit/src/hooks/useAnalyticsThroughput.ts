/**
 * TanStack Query hook for assignee throughput analytics (D-19).
 *
 * Wraps fetchAssigneeThroughput with query key [analytics, assigneeThroughput, processId, period].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchAssigneeThroughput } from "../api/cockpit-api";

export function useAnalyticsThroughput(processDefinitionKey: string, period: string) {
  return useQuery({
    queryKey: ["analytics", "assigneeThroughput", processDefinitionKey, period],
    queryFn: () => fetchAssigneeThroughput(processDefinitionKey, period),
    enabled: !!processDefinitionKey,
    staleTime: 60_000,
  });
}
