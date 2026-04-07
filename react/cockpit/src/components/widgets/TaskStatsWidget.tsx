import { WidgetShell } from "../shared/WidgetShell";
import { TaskCounter } from "../shared/TaskCounter";
import { StatusPieChart } from "../shared/StatusPieChart";
import { useTaskStats } from "../../hooks/useTaskStats";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import styles from "./TaskStatsWidget.module.css";

/**
 * Complete task stats dashboard (D-33).
 *
 * Top row: 3 TaskCounters (Due today / Upcoming / Overdue).
 * Bottom: StatusPieChart with instancesByStatus donut.
 */
export function TaskStatsWidget() {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useTaskStats(period);

  return (
    <WidgetShell
      title="Task Stats"
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      <div className={styles.wrapper}>
        <div className={styles.counters}>
          <TaskCounter
            label="Due today"
            count={data?.tasksDueToday ?? 0}
            variant="accent"
          />
          <TaskCounter
            label="Upcoming"
            count={data?.tasksUpcoming ?? 0}
            variant="default"
          />
          <TaskCounter
            label="Overdue"
            count={data?.tasksOverdue ?? 0}
            variant="danger"
          />
        </div>
        {data?.instancesByStatus && (
          <StatusPieChart data={data.instancesByStatus} />
        )}
      </div>
    </WidgetShell>
  );
}
