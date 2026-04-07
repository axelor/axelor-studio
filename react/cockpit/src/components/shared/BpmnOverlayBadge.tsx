/**
 * Factory function that creates a DOM element for bpmn-js overlay badge (pass count).
 *
 * NOT a React component — returns an HTMLElement for overlays.add().
 * Uses DOM API (not innerHTML) to avoid XSS (Pitfall 4).
 */

import styles from "./BpmnOverlayBadge.module.css";

export function createOverlayBadge(count: number): HTMLElement {
  const el = document.createElement("div");
  el.className = styles.badge;
  el.textContent = String(count);
  return el;
}
