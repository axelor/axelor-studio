/**
 * Process Detail Page — master-detail with tab navigation (D-04, D-05, D-14, UI-SPEC).
 *
 * Tab bar: Instances | Analytics (URL-driven via ?tab= search param).
 * Instances tab: StatusFilterPills + InstanceList (60%) + BPMN preview (40%).
 * Analytics tab: AnalyticsTab grid shell (Plan 03+).
 *
 * Responsive:
 * - >= 1024px: 60/40 side-by-side (instances)
 * - 768-1023px: stacked (list above, preview below 250px)
 * - < 768px: list only (preview hidden)
 */

import { useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { axelorBridge } from "@studio/shared/bridge";

import type { ProcessListResponse } from "../api/types";
import { useInstanceSummary } from "../hooks/useInstanceSummary";
import { useCockpitStore } from "../stores/useCockpitStore";
import { ProcessHeader } from "../components/widgets/ProcessHeader";
import { StatusFilterPills } from "../components/shared/StatusFilterPills";
import { InstanceList } from "../components/widgets/InstanceList";
import { InstanceDiagram } from "../components/widgets/InstanceDiagram";
import { AnalyticsTab } from "../components/widgets/AnalyticsTab";

import styles from "./ProcessDetailPage.module.css";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = "instances" | "analytics";

const TABS: { id: TabId; label: string }[] = [
  { id: "instances", label: "Instances" },
  { id: "analytics", label: "Analytics" },
];

// ---------------------------------------------------------------------------
// Process name resolution from TanStack Query cache
// ---------------------------------------------------------------------------

function useProcessName(processId: number): string {
  const queryClient = useQueryClient();
  const cached = queryClient.getQueryData<ProcessListResponse>([
    "cockpit",
    "processes",
  ]);
  // Also try period-specific keys
  const allQueries = queryClient.getQueriesData<ProcessListResponse>({
    queryKey: ["cockpit"],
  });
  for (const [, data] of allQueries) {
    const match = data?.processes?.find((p) => p.id === processId);
    if (match) return match.name;
  }
  const directMatch = cached?.processes?.find((p) => p.id === processId);
  if (directMatch) return directMatch.name;
  return `Process #${processId}`;
}

/**
 * Resolve processDefinitionKey (code) from TanStack Query cache.
 * Same scan pattern as useProcessName but returns the `code` field.
 */
function useProcessDefinitionKey(processId: number): string {
  const queryClient = useQueryClient();
  const allQueries = queryClient.getQueriesData<ProcessListResponse>({
    queryKey: ["cockpit"],
  });
  for (const [, data] of allQueries) {
    const match = data?.processes?.find((p) => p.id === processId);
    if (match) return match.code;
  }
  return "";
}

// ---------------------------------------------------------------------------
// ProcessDetailPage
// ---------------------------------------------------------------------------

export function ProcessDetailPage() {
  const { processId: rawId } = useParams<{ processId: string }>();
  const processId = Number(rawId) || 0;

  const processName = useProcessName(processId);
  const processDefinitionKey = useProcessDefinitionKey(processId);

  // Tab state from URL search params (default: instances)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: TabId =
    searchParams.get("tab") === "analytics" ? "analytics" : "instances";

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", tab);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let nextIndex = -1;

      if (e.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      }

      if (nextIndex >= 0) {
        e.preventDefault();
        const nextTab = TABS[nextIndex];
        handleTabChange(nextTab.id);
        // Focus the next tab button
        const target = e.currentTarget.querySelector<HTMLButtonElement>(
          `[data-tab="${nextTab.id}"]`,
        );
        target?.focus();
      }
    },
    [activeTab, handleTabChange],
  );

  const { data: counts, isLoading: countsLoading } =
    useInstanceSummary(processId);

  const selectedInstanceId = useCockpitStore((s) => s.selectedInstanceId);
  const selectInstance = useCockpitStore((s) => s.selectInstance);
  const statusFilter = useCockpitStore((s) => s.instanceStatusFilter);
  const setStatusFilter = useCockpitStore((s) => s.setInstanceStatusFilter);

  // Default counts for StatusFilterPills when loading
  const defaultCounts = { running: 0, completed: 0, failed: 0, suspended: 0 };

  return (
    <div className={styles.processDetail}>
      {/* Row 1: Header spans full width */}
      <div className={styles.processHeader}>
        <ProcessHeader
          processName={processName}
          counts={counts}
          isLoading={countsLoading}
        />
      </div>

      {/* Row 2: Tab bar */}
      <div
        className={styles.tabBar}
        role="tablist"
        aria-label={axelorBridge.translate("Process detail views")}
        onKeyDown={handleTabKeyDown}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            data-tab={tab.id}
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {axelorBridge.translate(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "instances" ? (
        <div
          role="tabpanel"
          id="panel-instances"
          aria-labelledby="tab-instances"
          className={styles.instancePanel}
        >
          <div className={styles.statusFilters}>
            <StatusFilterPills
              counts={counts ?? defaultCounts}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
          </div>
          <div className={styles.instanceContent}>
            <div className={styles.instanceList}>
              <InstanceList
                processId={processId}
                onSelectInstance={selectInstance}
                selectedInstanceId={selectedInstanceId}
              />
            </div>
            <div className={styles.bpmnPreview}>
              {selectedInstanceId ? (
                <InstanceDiagram
                  processId={processId}
                  instanceId={selectedInstanceId}
                  onNodeClick={() => {}}
                  mode="mini"
                />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <svg
                    className={styles.previewIcon}
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect x="4" y="24" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                    <rect x="24" y="24" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                    <rect x="44" y="24" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                    <line x1="20" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                    <line x1="40" y1="32" x2="44" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                    <circle cx="50" cy="18" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.25" fill="none" />
                    <line x1="57" y1="25" x2="62" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  </svg>
                  <p className={styles.previewText}>
                    {axelorBridge.translate("Select an instance to preview")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-analytics"
          aria-labelledby="tab-analytics"
        >
          <AnalyticsTab processId={processId} processDefinitionKey={processDefinitionKey} />
        </div>
      )}
    </div>
  );
}
