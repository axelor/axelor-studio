import React from "react";

import { Loader } from "@studio/shared/components";
import styles from "../bpmn-modeler.module.css";

interface ProgressOverlayProps {
  progress: number;
  allowProgressBarDisplay: boolean;
}

function ProgressOverlay({ progress, allowProgressBarDisplay }: ProgressOverlayProps) {
  if (!allowProgressBarDisplay || progress <= 0) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.loaderContainer}>
        <Loader classes={styles.loader} text={`${progress}% migration is done...`} />
      </div>
    </div>
  );
}

export default ProgressOverlay;
