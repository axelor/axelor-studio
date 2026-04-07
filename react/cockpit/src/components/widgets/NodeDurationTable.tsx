/**
 * Duration breakdown table for a node (D-08).
 *
 * Compact table: 3 rows (Total, Work, Idle) x 4 columns (This Instance, Avg, Min, Max).
 * Uses tabular-nums for aligned numeric columns.
 */

import { axelorBridge } from "@studio/shared/bridge";

import { formatDuration } from "../../utils/format";
import type { NodeDuration, NodeDurationStats } from "../../api/types";

import styles from "./NodeDurationTable.module.css";

interface NodeDurationTableProps {
  duration: NodeDuration;
  durationStats: NodeDurationStats;
}

export function NodeDurationTable({
  duration,
  durationStats,
}: NodeDurationTableProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.labelCol}>{""}</th>
          <th className={styles.valueCol}>
            {axelorBridge.translate("This instance")}
          </th>
          <th className={styles.valueCol}>
            {axelorBridge.translate("Average")}
          </th>
          <th className={styles.valueCol}>
            {axelorBridge.translate("Minimum")}
          </th>
          <th className={styles.valueCol}>
            {axelorBridge.translate("Maximum")}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={styles.label}>
            {axelorBridge.translate("Total")}
          </td>
          <td className={styles.value}>{formatDuration(duration.total)}</td>
          <td className={styles.value}>{formatDuration(durationStats.avg)}</td>
          <td className={styles.value}>{formatDuration(durationStats.min)}</td>
          <td className={styles.value}>{formatDuration(durationStats.max)}</td>
        </tr>
        <tr>
          <td className={styles.label}>
            {axelorBridge.translate("Work time")}
          </td>
          <td className={styles.value}>{formatDuration(duration.work)}</td>
          <td className={styles.value}>-</td>
          <td className={styles.value}>-</td>
          <td className={styles.value}>-</td>
        </tr>
        <tr>
          <td className={styles.label}>
            {axelorBridge.translate("Idle time")}
          </td>
          <td className={styles.value}>{formatDuration(duration.idle)}</td>
          <td className={styles.value}>-</td>
          <td className={styles.value}>-</td>
          <td className={styles.value}>-</td>
        </tr>
      </tbody>
    </table>
  );
}
