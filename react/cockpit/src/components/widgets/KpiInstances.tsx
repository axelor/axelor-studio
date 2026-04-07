import { WidgetShell } from "../shared/WidgetShell";
import { KpiCounter } from "../shared/KpiCounter";
import { useAdoptionOverview } from "../../hooks/useAdoptionOverview";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import styles from "./KpiInstances.module.css";

/**
 * Widget wrapping 3 KpiCounters showing adoption data.
 * Uses useAdoptionOverview to get totalProcesses, currentlyRunning, endedInPeriod.
 */
export function KpiInstances() {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useAdoptionOverview(period);

  return (
    <WidgetShell
      title="Adoption"
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      <div className={styles.row}>
        <KpiCounter
          label="Processes orchestrated"
          value={data?.totalProcesses ?? 0}
          staggerDelay={0}
        />
        <KpiCounter
          label="Currently in progress"
          value={data?.currentlyRunning ?? 0}
          staggerDelay={50}
        />
        <KpiCounter
          label="Ended in period"
          value={data?.endedInPeriod ?? 0}
          staggerDelay={100}
        />
      </div>
    </WidgetShell>
  );
}
