/**
 * Fuse.js wrapper for client-side process filtering (D-10).
 *
 * Provides fuzzy search across process name, description, code, and versionTag
 * with weighted scoring. Returns all processes when query is empty.
 */

import Fuse, { type IFuseOptions } from "fuse.js";
import { useMemo } from "react";

import type { ProcessSummary } from "../api/types";

const fuseOptions: IFuseOptions<ProcessSummary> = {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "description", weight: 0.2 },
    { name: "code", weight: 0.2 },
    { name: "versionTag", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
};

export function useFuzzySearch(
  processes: ProcessSummary[],
  query: string,
): ProcessSummary[] {
  return useMemo(() => {
    if (!query.trim()) return processes;
    const fuse = new Fuse(processes, fuseOptions);
    return fuse.search(query).map((result) => result.item);
  }, [processes, query]);
}
