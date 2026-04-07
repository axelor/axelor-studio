import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, Button } from "@axelor/ui";
import { axelorBridge } from "@studio/shared/bridge";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { queryClient } from "../../App";
import styles from "./CockpitToolbar.module.css";
import classnames from "classnames";

// ---------------------------------------------------------------------------
// Period options
// ---------------------------------------------------------------------------

interface PeriodOption {
  value: string;
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "6m", label: "6 months" },
];

// ---------------------------------------------------------------------------
// Refresh icon (inline SVG)
// ---------------------------------------------------------------------------

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.5 2.5v4h-4M2.5 13.5v-4h4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.2 6a5 5 0 0 1 9.2-1.3M12.8 10a5 5 0 0 1-9.2 1.3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// CockpitToolbar
// ---------------------------------------------------------------------------

export function CockpitToolbar() {
  const { period, setPeriod } = usePeriodFilter();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // On mount: sync URL period param -> Zustand store
  useEffect(() => {
    const urlPeriod = searchParams.get("period");
    if (urlPeriod && urlPeriod !== period) {
      setPeriod(urlPeriod);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOption =
    PERIOD_OPTIONS.find((o) => o.value === period) ?? PERIOD_OPTIONS[1];

  const handlePeriodChange = useCallback(
    (value: PeriodOption | null | undefined) => {
      if (value) {
        setPeriod(value.value);
        // Sync period to URL search params (D-13: persists across navigation)
        setSearchParams(
          (prev: URLSearchParams) => {
            prev.set("period", value.value);
            return prev;
          },
          { replace: true },
        );
      }
    },
    [setPeriod, setSearchParams],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className={styles.toolbar}>
      {/* Left: active view heading */}
      <h1 className={classnames(styles.heading, "ck-font-heading")}>
        {axelorBridge.translate("BPM Cockpit")}
      </h1>

      {/* Right: period filter + refresh */}
      <div className={styles.controls}>
        <div className={styles.periodSelect}>
          <Select<PeriodOption, false>
            options={PERIOD_OPTIONS}
            value={selectedOption}
            onChange={handlePeriodChange}
            optionKey={(o: PeriodOption) => o.value}
            optionLabel={(o: PeriodOption) => o.label}
            clearIcon={false}
          />
        </div>

        <Button
          variant="light"
          size="sm"
          onClick={handleRefresh}
          className={classnames(styles.refreshBtn, {
            [styles.isRefreshing]: isRefreshing,
          })}
          aria-label={axelorBridge.translate("Refresh data")}
        >
          <RefreshIcon />
        </Button>
      </div>
    </div>
  );
}
