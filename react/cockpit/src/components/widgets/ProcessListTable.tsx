/**
 * ProcessList view -- semantic HTML table with KPI badges (D-07).
 *
 * Primary interactive data surface of the cockpit.
 * Uses Fuse.js fuzzy search for client-side filtering.
 * KPI badge clicks open the SlideInPanel detail view.
 */

import { useNavigate } from "react-router-dom";

import { useCockpitStore } from "../../stores/useCockpitStore";
import { useProcessList } from "../../hooks/useProcessList";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import { useSlideInPanel } from "../../hooks/useSlideInPanel";
import { ProcessSearch } from "../shared/ProcessSearch";
import { KpiBadge } from "../shared/KpiBadge";
import { StatusBadge } from "../shared/StatusBadge";
import { WidgetShell } from "../shared/WidgetShell";
import { SlideInPanel } from "../layout/SlideInPanel";

import { axelorBridge } from "@studio/shared/bridge";

import styles from "./ProcessListTable.module.css";

export function ProcessListTable() {
  const navigate = useNavigate();
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useProcessList(period);

  const searchQuery = useCockpitStore((s) => s.searchQuery);
  const setSearchQuery = useCockpitStore((s) => s.setSearchQuery);
  const selectProcess = useCockpitStore((s) => s.selectProcess);
  const selectedProcessId = useCockpitStore((s) => s.selectedProcessId);

  const processes = data?.processes ?? [];
  const filteredProcesses = useFuzzySearch(processes, searchQuery);

  const panel = useSlideInPanel();

  return (
    <WidgetShell
      title={axelorBridge.translate("Processes")}
      isLoading={isLoading}
      error={error ?? undefined}
      onRetry={() => void refetch()}
    >
      <div className={styles.container}>
        <div className={styles.searchWrapper}>
          <ProcessSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.headerCell}>
                  {axelorBridge.translate("Name")}
                </th>
                <th className={styles.headerCell}>
                  {axelorBridge.translate("Status")}
                </th>
                <th className={styles.headerCell}>
                  {axelorBridge.translate("Version")}
                </th>
                <th className={styles.headerCell}>
                  {axelorBridge.translate("KPI: Time")}
                </th>
                <th className={styles.headerCell}>
                  {axelorBridge.translate("KPI: Quality")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    <svg className={styles.emptyIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    {searchQuery
                      ? axelorBridge.translate("No matching processes")
                      : axelorBridge.translate("No processes found")}
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((process) => (
                  <tr
                    key={process.id}
                    className={`${styles.row} ${
                      selectedProcessId === process.code
                        ? styles.rowSelected
                        : ""
                    }`}
                    onClick={() => {
                      selectProcess(process.code);
                      navigate(`/process/${process.id}`);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectProcess(process.code);
                        navigate(`/process/${process.id}`);
                      }
                    }}
                  >
                    <td className={styles.nameCell}>
                      <span className={styles.processName}>
                        {process.name}
                      </span>
                      {process.description && (
                        <span className={styles.processDescription}>
                          {process.description}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge statusSelect={process.statusSelect} />
                    </td>
                    <td className={styles.versionCell}>
                      {process.versionTag}
                    </td>
                    <td className={styles.kpiCell}>
                      {process.kpiTime.length > 0 && (
                        <KpiBadge
                          kpis={process.kpiTime}
                          onClick={(kpi) => panel.open(kpi, process.name)}
                        />
                      )}
                    </td>
                    <td className={styles.kpiCell}>
                      {process.kpiQuality.length > 0 && (
                        <KpiBadge
                          kpis={process.kpiQuality}
                          onClick={(kpi) => panel.open(kpi, process.name)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlideInPanel
        isOpen={panel.isOpen}
        onClose={panel.close}
        kpiDetail={panel.kpiDetail}
      />
    </WidgetShell>
  );
}
