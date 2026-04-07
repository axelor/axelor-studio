/**
 * TanStack Query hook for gateway branch distribution (D-08, D-25).
 *
 * Wraps fetchBranchDistribution with query key [cockpit, branch-distribution, key, gatewayId].
 * Only enabled when both processDefinitionKey and gatewayId are provided.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchBranchDistribution } from "../api/cockpit-api";

export function useBranchDistribution(
  processDefinitionKey: string | null,
  gatewayId: string | null,
) {
  return useQuery({
    queryKey: [
      "cockpit",
      "branch-distribution",
      processDefinitionKey,
      gatewayId,
    ],
    queryFn: () =>
      fetchBranchDistribution(processDefinitionKey!, gatewayId!),
    staleTime: 120_000,
    enabled: !!processDefinitionKey && !!gatewayId,
  });
}
