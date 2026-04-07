import { useState, useEffect, useCallback, useRef } from "react";

import { wsProgress } from "../../../services/Progress";

export interface DeployProgressResult {
  progress: number;
  startProgress: (id: number | string) => void;
  stopProgress: () => void;
  allowProgressBarDisplay: boolean;
  setAllowProgressBarDisplay: (val: boolean) => void;
  waitForConnection: (timeout?: number) => Promise<void>;
}

/**
 * Hook orchestrator for WebSocket deploy progress tracking.
 * Wraps the existing wsProgress singleton and manages its lifecycle.
 *
 * Progress state is local (not Zustand) because it's only relevant during deploy flow.
 */
export function useDeployProgress(): DeployProgressResult {
  const [progress, setProgress] = useState(0);
  const [allowProgressBarDisplay, setAllowProgressBarDisplay] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Subscribe to wsProgress events
  useEffect(() => {
    const handleProgress = (newProgress: number) => {
      setProgress(newProgress);
    };

    const handleCompletion = (completed: boolean) => {
      if (completed) {
        setProgress(100);
      }
    };

    const unsubProgress = wsProgress.subscribe(handleProgress);
    const unsubCompletion = wsProgress.subscribeToCompletion(handleCompletion);

    cleanupRef.current = () => {
      unsubProgress();
      unsubCompletion();
    };

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      wsProgress.disconnect();
    };
  }, []);

  // Auto-reset progress after 100% is reached
  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  const startProgress = useCallback((id: number | string) => {
    setProgress(0);
    wsProgress.init(String(id));
  }, []);

  const stopProgress = useCallback(() => {
    wsProgress.disconnect();
    setProgress(0);
  }, []);

  const waitForConnection = useCallback((timeout: number = 5000): Promise<void> => {
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
  }, []);

  return {
    progress,
    startProgress,
    stopProgress,
    allowProgressBarDisplay,
    setAllowProgressBarDisplay,
    waitForConnection,
  };
}
