/**
 * Branch distribution chart for gateway nodes (D-08, D-25).
 *
 * Horizontal bar chart showing percentage of executions per outgoing branch.
 * Only renders when branches data is available.
 */

import { axelorBridge } from "@studio/shared/bridge";

import type { BranchDistribution as BranchDistributionType } from "../../api/types";

import styles from "./BranchDistribution.module.css";

interface BranchDistributionProps {
  branches: BranchDistributionType[];
}

export function BranchDistribution({ branches }: BranchDistributionProps) {
  if (branches.length === 0) {
    return (
      <p className={styles.empty}>
        {axelorBridge.translate("No outgoing branches")}
      </p>
    );
  }

  const maxCount = Math.max(...branches.map((b) => b.count), 1);

  return (
    <div className={styles.container}>
      {branches.map((branch) => (
        <div key={branch.targetActivityId} className={styles.row}>
          <div className={styles.label}>
            <span className={styles.name}>
              {branch.targetActivityName ?? branch.targetActivityId}
            </span>
            <span className={styles.stats}>
              {branch.count}x ({branch.percentage.toFixed(0)}%)
            </span>
          </div>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${(branch.count / maxCount) * 100}%` }}
              role="progressbar"
              aria-valuenow={branch.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
