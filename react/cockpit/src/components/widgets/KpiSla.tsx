import { useMemo } from "react";
import { WidgetShell } from "../shared/WidgetShell";
import { KpiCounter } from "../shared/KpiCounter";
import { useProcessList } from "../../hooks/useProcessList";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";

/**
 * Determines SLA color based on compliance percentage.
 */
function slaColor(pct: number): string {
  if (pct >= 80) return "var(--bs-success)";
  if (pct >= 50) return "var(--bs-warning)";
  return "var(--bs-danger)";
}

/**
 * SLA compliance counter widget.
 * Computes aggregate SLA compliance from process kpiTime targets.
 */
export function KpiSla() {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useProcessList(period);

  const pct = useMemo(() => {
    const processes = data?.processes;
    if (!processes || processes.length === 0) return 0;

    const withinSla = processes.filter((p) => {
      const kpi = p.kpiTime[0];
      if (!kpi || kpi.target === null) return false;
      return kpi.rawValue <= kpi.target;
    }).length;

    return Math.round((withinSla / processes.length) * 100);
  }, [data]);

  const hasData = (data?.processes?.length ?? 0) > 0;

  return (
    <WidgetShell
      title="SLA Compliance"
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      {hasData ? (
        <KpiCounter
          label="Within target"
          value={pct}
          suffix="%"
          color={slaColor(pct)}
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
