/**
 * TanStack Query hook for paginated instance list (INST-02).
 *
 * Wraps fetchInstances with query key convention [cockpit, instances, processId, filters].
 */

import { useQuery } from "@tanstack/react-query";

import { fetchInstances } from "../api/cockpit-api";

export function useInstances(
  processId: number,
  status: string | null,
  page: number,
  search: string,
  pageSize = 20,
) {
  const offset = page * pageSize;
  return useQuery({
    queryKey: ["cockpit", "instances", processId, { status, page, search }],
    queryFn: () => fetchInstances(processId, status, offset, pageSize, search),
    staleTime: 60_000,
    enabled: processId > 0,
  });
}
