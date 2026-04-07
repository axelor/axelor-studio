/**
 * TanStack Query hook for BPMN XML of a process (INST-01/INST-02).
 *
 * Wraps fetchInstanceXml with 5-minute cache — diagram rarely changes.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchInstanceXml } from "../api/cockpit-api";

export function useInstanceXml(processId: number) {
  return useQuery({
    queryKey: ["cockpit", "instance-xml", processId],
    queryFn: () => fetchInstanceXml(processId),
    staleTime: 300_000, // 5 minutes — diagram rarely changes
    enabled: processId > 0,
  });
}
