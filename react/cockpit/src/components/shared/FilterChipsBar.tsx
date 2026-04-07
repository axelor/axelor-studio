/**
 * Horizontal bar rendering active analytics filters as removable chips (D-10).
 *
 * Consumes analyticsFilters from useCockpitStore.
 * Shows "No active filters" label when empty.
 */

import { axelorBridge } from "@studio/shared/bridge";

import { useCockpitStore } from "../../stores/useCockpitStore";
import { FilterChip } from "./FilterChip";

import styles from "./FilterChipsBar.module.css";

export function FilterChipsBar() {
  const filters = useCockpitStore((s) => s.analyticsFilters);
  const removeFilter = useCockpitStore((s) => s.removeAnalyticsFilter);

  return (
    <div className={styles.bar}>
      {filters.length === 0 ? (
        <span className={styles.empty}>
          {axelorBridge.translate("No active filters")}
        </span>
      ) : (
        filters.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            type={f.type}
            onRemove={() => removeFilter(f.id)}
          />
        ))
      )}
    </div>
  );
}
