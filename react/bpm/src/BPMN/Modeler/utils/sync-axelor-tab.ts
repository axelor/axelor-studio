/**
 * Standalone utility to sync dirty state with Axelor parent iframe tab.
 * Extracted from 3 duplicated implementations in hooks (D-05).
 */
export function syncAxelorTabDirty(dirty: boolean): void {
  const axelor = (window.top as unknown as Record<string, unknown>)?.axelor as // safety: window.top cross-frame access requires dynamic property lookup
    | Record<string, unknown>
    | undefined;
  if (axelor?.useActiveTab) {
    const [, setTabState] = (
      axelor.useActiveTab as () => [unknown, (v: { dirty: boolean }) => void]
    )();
    setTabState({ dirty });
  }
}
