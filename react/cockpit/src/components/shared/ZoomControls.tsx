/**
 * Floating zoom controls for BPMN viewer (D-07, UI-SPEC).
 *
 * Three icon buttons: zoom in (+), zoom out (-), fit to viewport.
 * Positioned absolute bottom-left of viewer container.
 */

import { axelorBridge } from "@studio/shared/bridge";

import styles from "./ZoomControls.module.css";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

function ZoomInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <polyline points="2,6 2,2 6,2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="10,2 14,2 14,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14,10 14,14 10,14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="6,14 2,14 2,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ZoomControls({ onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.button}
        onClick={onZoomIn}
        aria-label={axelorBridge.translate("Zoom in")}
      >
        <ZoomInIcon />
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onZoomOut}
        aria-label={axelorBridge.translate("Zoom out")}
      >
        <ZoomOutIcon />
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onFit}
        aria-label={axelorBridge.translate("Fit to view")}
      >
        <FitIcon />
      </button>
    </div>
  );
}
