/**
 * TanStack Query hook for ProcessHeader instance counts.
 *
 * Wraps fetchInstanceCounts with query key [cockpit, instance-summary, processId].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchInstanceCounts } from "../api/cockpit-api";

export function useInstanceSummary(processId: number) {
  return useQuery({
    queryKey: ["cockpit", "instance-summary", processId],
    queryFn: () => fetchInstanceCounts(processId),
    staleTime: 60_000,
    enabled: processId > 0,
  });
}
