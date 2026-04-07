/**
 * Pure helper functions extracted from useDiagramPersistence.
 * No React hook dependencies -- independently testable.
 */
import { wsProgress } from "../../../services/Progress";

// ---------------------------------------------------------------------------
// waitForConnection -- WebSocket connection poller with timeout
// ---------------------------------------------------------------------------

export function waitForConnection(timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (wsProgress.isConnected()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("WebSocket connection timeout"));
    }, timeout);

    const cleanup = wsProgress.subscribeToConnection((connected: boolean) => {
      if (connected) {
        clearTimeout(timeoutId);
        cleanup();
        resolve();
      }
    });
  });
}
