import styles from "./LoadingSkeleton.module.css";

interface LoadingSkeletonProps {
  /** Overall height of the skeleton area */
  height?: number | string;
}

/**
 * Pulse-animated skeleton placeholder for loading states.
 * Uses the ck-skeleton-pulse keyframe defined in motion.css.
 */
export function LoadingSkeleton({ height = 120 }: LoadingSkeletonProps) {
  return (
    <div className={styles.container} style={{ height }}>
      <div className={styles.bar} style={{ width: "60%" }} />
      <div className={styles.bar} style={{ width: "80%" }} />
      <div className={styles.bar} style={{ width: "40%" }} />
      <div className={styles.bar} style={{ width: "70%" }} />
    </div>
  );
}
