/**
 * Passage history list for a node (D-08).
 *
 * Chronological list of node executions with start/end time, duration, assignee.
 * Shows multiple entries for loops/multi-instance nodes.
 */

import { axelorBridge } from "@studio/shared/bridge";

import { formatDuration, formatDateTime } from "../../utils/format";
import type { PassageEntry } from "../../api/types";

import styles from "./PassageHistory.module.css";

interface PassageHistoryProps {
  passages: PassageEntry[];
}

export function PassageHistory({ passages }: PassageHistoryProps) {
  if (passages.length === 0) {
    return (
      <p className={styles.empty}>
        {axelorBridge.translate("No recorded passages")}
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {passages.map((p, idx) => (
        <li key={idx} className={styles.entry}>
          <div className={styles.times}>
            <span className={styles.time}>{formatDateTime(p.startTime)}</span>
            <span className={styles.arrow}>&rarr;</span>
            <span className={styles.time}>
              {p.endTime
                ? formatDateTime(p.endTime)
                : axelorBridge.translate("In progress")}
            </span>
          </div>
          <div className={styles.meta}>
            <span className={styles.duration}>
              {formatDuration(p.durationMs)}
            </span>
            <span className={styles.assignee}>
              {p.assignee ?? axelorBridge.translate("Unassigned")}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
