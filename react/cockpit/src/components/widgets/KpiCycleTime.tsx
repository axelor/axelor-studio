import { useMemo } from "react";
import { WidgetShell } from "../shared/WidgetShell";
import { KpiCounter } from "../shared/KpiCounter";
import { useProcessList } from "../../hooks/useProcessList";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";

/**
 * Formats minutes into "Xh Ym" or "Xm" display string.
 */
function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(minutes)}m`;
}

/**
 * KPI widget showing average cycle time across all processes.
 * Uses useProcessList and computes average kpiTime rawValue.
 */
export function KpiCycleTime() {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useProcessList(period);

  const { avgMinutes, displaySuffix } = useMemo(() => {
    const processes = data?.processes;
    if (!processes || processes.length === 0) {
      return { avgMinutes: 0, displaySuffix: "" };
    }
    const total = processes.reduce(
      (sum, p) => sum + (p.kpiTime[0]?.rawValue ?? 0),
      0,
    );
    const avg = total / processes.length;
    return { avgMinutes: Math.round(avg), displaySuffix: formatMinutes(avg) };
  }, [data]);

  const hasData = (data?.processes?.length ?? 0) > 0;

  return (
    <WidgetShell
      title="Cycle Time"
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      {hasData ? (
        <KpiCounter
          label="Avg. cycle time"
          value={avgMinutes}
          suffix={avgMinutes >= 60 ? "m" : "m"}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 4, opacity: 0.5 }}>
          <span className="ck-font-display" style={{ fontSize: 20 }}>&mdash;</span>
          <span className="ck-font-label">No data for period</span>
        </div>
      )}
    </WidgetShell>
  );
}
