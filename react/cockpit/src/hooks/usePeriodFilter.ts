/**
 * Convenience hook for reading/setting the period from the cockpit store.
 */

import { useCockpitStore } from "../stores/useCockpitStore";

export function usePeriodFilter() {
  const period = useCockpitStore((s) => s.period);
  const setPeriod = useCockpitStore((s) => s.setPeriod);
  return { period, setPeriod } as const;
}
