/**
 * TanStack Query hook for instance activity data (BPMN overlays).
 *
 * Wraps fetchInstanceActivities with 60s cache for near-realtime overlay updates.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchInstanceActivities } from "../api/cockpit-api";

export function useInstanceActivities(processInstanceId: string | null) {
  return useQuery({
    queryKey: ["cockpit", "instance-activities", processInstanceId],
    queryFn: () => fetchInstanceActivities(processInstanceId!),
    staleTime: 60_000,
    enabled: !!processInstanceId,
  });
}
