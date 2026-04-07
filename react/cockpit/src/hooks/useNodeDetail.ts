/**
 * TanStack Query hook for node detail data (D-08).
 *
 * Wraps fetchNodeDetail with query key [cockpit, node-detail, instanceId, activityId].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchNodeDetail } from "../api/cockpit-api";

export function useNodeDetail(
  processInstanceId: string | null,
  activityId: string | null,
  processDefinitionKey: string | null,
) {
  return useQuery({
    queryKey: ["cockpit", "node-detail", processInstanceId, activityId],
    queryFn: () =>
      fetchNodeDetail(processInstanceId!, activityId!, processDefinitionKey!),
    staleTime: 60_000,
    enabled: !!processInstanceId && !!activityId && !!processDefinitionKey,
  });
}
